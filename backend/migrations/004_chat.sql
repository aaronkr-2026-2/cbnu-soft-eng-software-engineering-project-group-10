CREATE TABLE conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_id uuid NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
 requester_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(report_id,requester_id)
);
CREATE TABLE conversation_members (
 conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE INDEX conversation_members_user_idx ON conversation_members(user_id,conversation_id);
CREATE TABLE messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL, client_message_id uuid NOT NULL,
 body text NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(conversation_id,sender_id) REFERENCES conversation_members(conversation_id,user_id),
 UNIQUE(conversation_id,sender_id,client_message_id)
);
CREATE INDEX messages_page_idx ON messages(conversation_id,created_at DESC,id DESC);
