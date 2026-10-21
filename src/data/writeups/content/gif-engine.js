export const gifEngine = {
  id: "gif-engine",
  title: "Gif-Engine: Animation on the Desktop",
  subtitle:
    "A Rust desktop animation player combining image compositing, frame scheduling, and independent playback windows.",
  date: "2024",
  categories: ["tools", "systems"],
  tags: ["rust", "winit", "softbuffer", "egui", "animation", "windows"],
  readTime: "5 min",
  featured: false,
  content: `## Overview

Gif-Engine is a Rust application for playing animations in desktop windows. The manager lets you configure and launch them; the player handles frame timing, placement, transparency, click-through behavior, and anchoring to another window.

The project uses egui/eframe for the manager and winit with softbuffer for playback. Keeping those parts separate lets the configuration interface behave like an ordinary application while animation windows have their own lifecycle and interaction rules.

## One frame format, several image formats

GIF and APNG arrive with different playback semantics. The decoders normalize them into frames containing RGBA pixels, dimensions, and a delay. The player can then advance through one representation instead of implementing each file format itself.

APNG makes this especially useful. A frame may update only a rectangle, and its disposal rule can keep the image, clear a region, or restore an earlier canvas. The decoder maintains the compositing canvas and produces complete images for playback. By the time a frame reaches the renderer, those format-specific decisions are already resolved.

The current implementation predecodes animations. That simplifies timing, because a frame deadline does not also need to wait for decompression. It trades memory for predictable access: a long, high-resolution animation expands into many full RGBA buffers. A bounded decoding window would be a worthwhile extension for larger files.

## Rendering is also a pixel-format conversion

The renderer writes into a softbuffer surface. Source pixels arrive as RGBA channels, while the destination expects packed values. The conversion includes alpha premultiplication:

\`\`\`rust
let r_pre = (r * a) / 255;
let g_pre = (g * a) / 255;
let b_pre = (b * a) / 255;
*pixel = (a << 24) | (r_pre << 16) | (g_pre << 8) | b_pre;
\`\`\`

Multiplying the color channels by alpha prepares translucent pixels for compositing. This is a small piece of code with a visible consequence: mistakes here show up as dark fringes, incorrect colors, or opaque edges. Backend-specific transparency still needs visual verification on the target platform.

## Waking up when something needs to happen

The player schedules frame deadlines with \`Instant\`, \`Duration\`, and winit's \`ControlFlow::WaitUntil\`. It does not need to continuously poll just because an animation is visible.

Interaction can require an earlier wakeup. An animation anchored to a moving window needs to check that window's position; click-through behavior has its own polling interval. The event loop chooses the next useful deadline across these tasks. Animation cadence and desktop interaction therefore remain related without being forced into one fixed frame rate.

## A player is also a process

The manager starts playback using the same executable in its \`play\` mode. A shortened excerpt of the launch path shows that relationship:

\`\`\`rust
let mut cmd = Command::new(exe);
cmd.arg("play").arg(&config.path);
// Playback options are added before spawning.
match cmd.spawn() {
    Ok(child) => {
        let mut ps = Self::lock_process_store(&self.process_store);
        ps.add_process(child.id(), config.name.clone());
    }
    // Error handling omitted.
}
\`\`\`

Each player can run independently of the manager. The process store records which animations are running so the interface can list and manage them. That independence is useful, but it also means process identity and shared bookkeeping deserve the same attention as decoding.

## Placement is a feature, not just a coordinate

The player's configuration includes scale, frame-rate options, alignment, monitor selection, overlay behavior, and click-through settings. Those controls affect how an animation participates in the desktop, not just what pixels it contains.

Monitor-relative alignment is useful because a saved absolute position can become wrong when the display arrangement changes. Anchoring introduces a moving reference frame: the player checks the target window's rectangle and updates its own placement. Window closure and invalid handles are therefore part of normal playback behavior, rather than exceptional decoding failures.

This is also why the platform code belongs outside the decoder. An animation remains the same sequence of frames whether it follows a window, sits in a corner, or allows clicks to pass through it. Keeping that distinction makes it possible to change desktop behavior without changing file-format handling.

## Preserving frame delays during decoding

The GIF decoder collects image-library frames, rejects an empty animation, and translates each result into the player's own frame representation:

\`\`\`rust
let delay: std::time::Duration = f.delay().into();
total_duration += delay;

result_frames.push(Frame {
    buffer: buffer.to_vec(),
    width: buffer.width(),
    height: buffer.height(),
    delay,
});
\`\`\`

The delay stays attached to its pixels instead of being replaced with one global playback rate. The decoder also accumulates total duration and frame count into animation metadata. The player receives a uniform representation regardless of which file-format decoder produced it.

## Choosing the next event-loop deadline

Playback combines animation timing with desktop interaction. An anchored player polls more frequently than a player checking only hotkeys; a paused player still needs to respond to interaction. The selected wakeup is:

\`\`\`rust
let next_wakeup = if paused {
     now + poll_interval
} else if click_through || anchor.is_some() {
    std::cmp::min(next_frame_deadline, now + poll_interval)
} else {
    next_frame_deadline
};
elwt.set_control_flow(ControlFlow::WaitUntil(next_wakeup));
\`\`\`

This is a small scheduler with competing deadlines. When no extra polling is needed, the next frame controls the wakeup. When anchoring or click-through interaction needs attention sooner, the earlier deadline wins. Pausing suppresses frame advancement without making the window unresponsive.

## APNG disposal as canvas state

The APNG decoder maintains a compositing canvas and remembers the preceding frame's control data. Disposal can retain that canvas, clear the previous frame's rectangle, or restore a saved canvas. A frame requesting previous-canvas restoration causes the decoder to preserve the necessary state before drawing.

That is why complete decoded frames are useful to the rest of the application: the player does not need to reinterpret rectangle offsets and disposal operations on every redraw. The implementation pays the compositing and storage cost once during loading, trading expanded memory for simple frame presentation.

## Concepts explored

The project connects image-format semantics, alpha representation, monotonic deadlines, and window placement. Each is visible in a concrete stage: decode and composite, convert pixels, schedule a frame, then position its window.

## Things to do next

The two most useful improvements are bounded memory use and stronger process ownership. Decoding ahead by a limited number of frames would let larger animations play without retaining every expanded image.
`,
};
