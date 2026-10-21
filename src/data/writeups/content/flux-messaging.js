export const fluxMessaging = {
  id: "flux-messaging",
  title: "Flux: Building a Messaging Backend",
  subtitle:
    "A five-person messaging experiment, with a Rust backend connecting persistent conversations to live events.",
  date: "2024",
  categories: ["closed", "systems", "fullstack"],
  tags: ["rust", "axum", "tokio", "postgresql", "websockets", "team-project"],
  readTime: "7 min",
  featured: true,
  content: `## Overview

Flux is a five-person experiment in building a messaging platform: servers and channels, direct messages, roles, reactions, attachments, presence, and voice signaling. The interesting part of my contribution was making those features meet in one backend—where a message has to become persistent data, a live update, and sometimes a notification.

I worked on the backend and the frontend's design direction, not the frontend implementation. Most of the frontend visual design was produced using AI. This was a fun experiment with four other people, rather than a product I intended to develop fully; that distinction matters when looking at the breadth of the interface.

The backend uses Rust, Axum, Tokio, and PostgreSQL through SQLx. Object storage handles uploaded files, while WebSockets carry live events. That gives the application two complementary paths: HTTP for requests that change or retrieve data, and a persistent connection for updates that arrive without a refresh.

## Following a message through the system

Sending a message starts with authentication and checks such as slow mode and mutes. The handler inserts the message into PostgreSQL, associates attachments, retrieves the joined message and author data, handles mentions, and publishes a live event.

That sequence is useful to understand because the database and the WebSocket connection have different jobs. PostgreSQL keeps the conversation available after a disconnect; the event tells connected clients that something changed. A successful broadcast alone would not make a message durable.

The event format makes those changes explicit. This excerpt from the WebSocket module shows the shared envelope:

\`\`\`rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "payload")]
pub enum ChatEvent {
    NewMessage(MessageWithUser),
    UpdateMessage(MessageWithUser),
    DeleteMessage { id: i32, channel_id: i32 },
    // Other event variants omitted.
}
\`\`\`

Serde turns each variant into a message with a type and payload. A client can distinguish an edit from a deletion without guessing from the shape of an arbitrary object. The same enum also gives backend code a concrete vocabulary for changes.

## Keeping live work separate from request work

Application state is shared through an \`Arc\`, including the database pool, storage client, and event broadcaster. Tokio's broadcast channel lets connections subscribe to events without making an HTTP handler write directly to every socket.

The socket task also handles connection-specific traffic. Its send loop selects between broadcast events and an internal channel, so a direct response such as a pong does not need to become a platform-wide event. Notification and direct-message events carry recipient information used to filter delivery.

This separation is one of the more substantial parts of the project: adding a feature means thinking about its stored representation, request validation, event format, and recipients together. Roles, moderation, and group conversations make that considerably more interesting than a single public chat room.

## Files, authentication, and transactions

Passwords are hashed with Argon2 and random salts. Authentication produces signed JWTs used by HTTP requests and the WebSocket connection. Uploads use an S3-compatible client configured for R2; image processing is moved onto \`spawn_blocking\` so that CPU-heavy work does not occupy an asynchronous executor thread.

Database transactions appear where several records form one operation. Creating a direct-message room and its membership records, for example, commits them together. That is a useful pattern to extend: a message and its attachments should also have a single, predictable success boundary.

## More than one kind of conversation

Channels and direct messages can look similar in the interface while requiring different backend rules. A channel belongs to a server and its roles; a direct-message room belongs to its participants. Group conversations add membership changes on top of that distinction.

Flux models more than a text stream: invites establish entry into a server, categories organize channels, roles and permissions determine access, and moderation affects what a participant can do. Reactions and message edits then create updates to existing objects rather than new conversation entries. The event enum gives those changes distinct representations instead of forcing clients to reload an entire conversation after every interaction.

This breadth is what makes the backend an interesting team contribution. A new feature has to fit existing identities, membership, persistence, and delivery rules. A reaction is small in the interface, but its creation, removal, and delivery still have to refer to the correct message and audience.

## Uploads introduce a different workload

Attachments cross several resource boundaries. The HTTP request receives bytes, image handling can transform them, object storage holds the content, and database records connect that content to a message. Each stage has a different failure mode.

The backend has size limits for different upload categories and moves image optimization into blocking work. That protects the asynchronous runtime from CPU-heavy processing, but uploads are still buffered in memory. The application therefore needs to consider concurrent uploads as well as a single file's limit.

Object storage also creates a lifecycle question: what happens to a file if its upload succeeds but message creation does not? A more complete implementation would track pending and committed attachments and periodically reclaim abandoned objects. This is an example of useful next work that follows directly from an existing feature rather than expanding the interface.

## Presence and notification state

Presence and notifications have different lifetimes from conversation history. A message remains in PostgreSQL after a socket closes; presence reflects both a saved preference and a connection's current behavior. The WebSocket connection reads that preference and preserves states such as idle, do-not-disturb, and invisible. An invisible connection does not simply announce itself as online.

Mentions create a personalized path through the message handler. The sender is excluded from mention recipients, while unread and mention counters are updated for other participants. Those summaries let the interface show activity without rereading every conversation. They also introduce derived state: message creation and notification updates need consistent success and read-acknowledgement rules.

Multiple devices and abrupt disconnects would need a fuller presence policy. A single socket disappearing does not necessarily mean a participant has no remaining connections. That is a concrete extension of the current model rather than another unrelated interface feature.

## Image optimization and thumbnail generation

The attachment handler contains a concrete media pipeline. It distinguishes avatar/banner storage from general images, limits dimensions to 1024 or 2048 pixels accordingly, resizes with a Lanczos filter, and encodes the result as WebP. GIFs bypass the main optimization path to preserve their original data.

The upload handler selects image dimensions according to the attachment category:

\`\`\`rust
let (max_w, max_h) = match folder {
    "images" => (1024, 1024),
    _ => (2048, 2048),
};

let processed_img = if width > max_w || height > max_h {
    img.resize(max_w, max_h, image::imageops::FilterType::Lanczos3)
} else {
    img
};
\`\`\`

A second path produces a WebP thumbnail with a 400-pixel long edge and an aspect-ratio-derived short edge. The upload response returns the content URL, optional thumbnail URL, and file type. The frontend can therefore display a preview without using the full attachment as its thumbnail. CPU image work runs through blocking tasks; the object-storage client handles the resulting bytes separately.

## Typed events and recipient filtering

The event enum represents direct-message delivery differently from a public change:

\`\`\`rust
NewDmMessage {
    message: crate::handlers::dm::DmMessage,
    target_user_ids: Vec<i32>,
},
\`\`\`

The socket's send path uses those target IDs to filter delivery. Notifications carry a single recipient and unread/mention counts, while typing and voice-state changes have their own variants. This gives the backend a typed vocabulary covering persistent content, transient activity, and personalized summaries. The important implementation is not merely having a WebSocket: it is translating distinct application actions into explicit messages with different audiences.

## Concepts explored

Relational message storage, tagged event serialization, asynchronous socket delivery, and blocking image processing meet in one backend. The source illustrates these through concrete handlers rather than a claim that the prototype is a production messaging service.

## Things to do next

The next substantial backend work would be making event delivery more dependable and more tightly scoped. The current broadcast channel is bounded, and a lagging connection can miss updates.
`,
};
