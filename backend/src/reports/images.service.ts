import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import sharp from 'sharp';
import { DatabaseService } from '../database/database.service.js';
import { ReportsService } from './reports.service.js';
import { uuid } from '../common/validation.js';
@Injectable()
export class ImagesService {
  private processing = 0;
  constructor(
    private readonly db: DatabaseService,
    private readonly reports: ReportsService,
  ) {}
  async upload(id: string, user: string, file?: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new BadRequestException('Image file required');
    if (file.buffer.length > 4 * 1024 * 1024)
      throw new PayloadTooLargeException('Image exceeds 4 MiB');
    await this.db.transaction((client) => this.reports.owned(client, id, user));
    if (this.processing >= 2)
      throw new ServiceUnavailableException('Image processor busy');
    this.processing++;
    try {
      let data: Buffer, width: number, height: number;
      try {
        const source = sharp(file.buffer, {
          limitInputPixels: 16000000,
          failOn: 'warning',
        });
        const meta = await source.metadata();
        if (
          !meta.format ||
          !['jpeg', 'png', 'webp'].includes(meta.format) ||
          (meta.pages ?? 1) > 1
        )
          throw new Error();
        const output = await source
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        data = output.data;
        width = output.info.width;
        height = output.info.height;
      } catch {
        throw new BadRequestException(
          'Use a valid single-frame JPEG, PNG or WebP up to 16 megapixels',
        );
      }
      if (data.length > 1048576)
        throw new PayloadTooLargeException('Processed image exceeds 1 MiB');
      return await this.db.transaction(async (client) => {
        await this.reports.owned(client, id, user);
        const count = await client.query(
          'SELECT count(*)::int AS n FROM report_images WHERE report_id=$1',
          [id],
        );
        if (count.rows[0].n >= 3)
          throw new BadRequestException('Maximum three images per report');
        const image = (
          await client.query(
            'INSERT INTO report_images(report_id,data,width,height) VALUES($1,$2,$3,$4) RETURNING id,width,height',
            [id, data, width, height],
          )
        ).rows[0];
        return { ...image, url: '/images/' + image.id };
      });
    } finally {
      this.processing--;
    }
  }
  async read(id: string) {
    const row = (
      await this.db.pool.query(
        `SELECT i.data,i.content_type FROM report_images i JOIN reports r ON r.id=i.report_id
   WHERE i.id=$1 AND r.deleted_at IS NULL`,
        [uuid(id)],
      )
    ).rows[0];
    if (!row) throw new NotFoundException('Image not found');
    return row;
  }
  async remove(report: string, id: string, user: string) {
    uuid(id);
    await this.db.transaction(async (client) => {
      await this.reports.owned(client, report, user);
      if (
        !(
          await client.query(
            'DELETE FROM report_images WHERE id=$1 AND report_id=$2 RETURNING id',
            [id, report],
          )
        ).rowCount
      )
        throw new NotFoundException('Image not found');
    });
    return { success: true };
  }
}
