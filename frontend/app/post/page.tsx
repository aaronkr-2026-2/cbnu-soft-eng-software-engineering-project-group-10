import { ItemForm } from '@/components/item-form';
import { PageHeading } from '@/components/page-heading';
import { RequireLogin } from '@/components/require-login';

export const metadata = { title: 'Create a post' };
export default function NewPostPage() {
  return <RequireLogin next="/post"><div className="container-page py-12 sm:py-16"><PageHeading eyebrow="Help your community" title="Report an item" description="Lost something? Found something? Create a report in just a few steps to help reconnect it with the right person."/><ItemForm/></div></RequireLogin>;
}
