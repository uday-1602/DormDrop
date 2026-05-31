import os
import sys
from moviepy import (
    VideoFileClip,
    ImageClip,
    TextClip,
    ColorClip,
    CompositeVideoClip,
    concatenate_videoclips
)

# Paths
VIDEO_PATH = r"C:\Users\ranveer\Downloads\WhatsApp Video 2026-05-31 at 13.11.45.mp4"
LOGO_PATH = r"d:\_projects\DormDrop\gemini-video-assets\dormdrop_logo.png"
CHAT_PATH = r"d:\_projects\DormDrop\gemini-video-assets\screenshot_chat_mobile.png"
OUTPUT_PATH = r"d:\_projects\DormDrop\gemini-video-assets\DormDrop_Viral_Reel.mp4"
FONT_PATH = r"C:\Windows\Fonts\arialbd.ttf" # Arial Bold

if not os.path.exists(FONT_PATH):
    # Fallback to standard arial.ttf if bold is missing
    FONT_PATH = r"C:\Windows\Fonts\arial.ttf"

print("Starting video edit...")

# 1. Load the raw video
if not os.path.exists(VIDEO_PATH):
    print(f"Error: Raw video not found at {VIDEO_PATH}")
    sys.exit(1)

video = VideoFileClip(VIDEO_PATH)
w, h = video.size # should be 576, 1024
print(f"Loaded video: {w}x{h}, {video.duration}s")

# Helper to create text overlays
def create_text(text, duration, font_size=32, vertical_pos=800, color='white', stroke_color='black', stroke_width=2):
    return (
        TextClip(
            text=text,
            font=FONT_PATH,
            font_size=font_size,
            color=color,
            stroke_color=stroke_color,
            stroke_width=stroke_width,
            text_align='center'
        )
        .with_duration(duration)
        .with_position(('center', vertical_pos))
    )

# 2. Build Clip 1: Sped-up scroll
print("Processing Clip 1: Scroll (Sped up & Zoomed)...")
clip1_raw = video.subclipped(0, 4)
clip1_resized = clip1_raw.resized(1.35)
clip1 = clip1_resized.cropped(x_center=clip1_resized.w // 2, y_center=clip1_resized.h // 2, width=w, height=h)
clip1 = clip1.with_speed_scaled(1.5)
text1 = create_text("Hostel WhatsApp groups flooded\nwith cycles, kettles, and books?", clip1.duration, font_size=32)
clip1_composed = CompositeVideoClip([clip1, text1])

# 3. Build Clip 2: Select & Scroll
print("Processing Clip 2: Selection (Normal speed & Zoomed)...")
clip2_raw = video.subclipped(4, 9)
clip2_resized = clip2_raw.resized(1.35)
clip2 = clip2_resized.cropped(x_center=clip2_resized.w // 2, y_center=clip2_resized.h // 2, width=w, height=h)
text2 = create_text("Buy & sell all hostel gear\ndirectly on your campus.", clip2.duration, font_size=32)
clip2_composed = CompositeVideoClip([clip2, text2])

# 4. Build Clip 3: Zoom on Buy Button
print("Processing Clip 3: Zoom on Buy Button...")
clip3_raw = video.subclipped(9, 11)
# Resize by 1.5x and crop to center to create a zoom effect
clip3_resized = clip3_raw.resized(1.5)
clip3 = clip3_resized.cropped(x_center=clip3_resized.w // 2, y_center=clip3_resized.h // 2, width=w, height=h)
text3 = create_text("0% Commission.\nPure peer-to-peer deals.", clip3.duration, font_size=32)
clip3_composed = CompositeVideoClip([clip3, text3])

# 5. Build Clip 4: Ghost Mode Chat Screen
print("Processing Clip 4: Ghost Mode Chat...")
chat_duration = 4.0
chat_bg = ColorClip(size=(w, h), color=(18, 18, 18), duration=chat_duration)
chat_img = ImageClip(CHAT_PATH).resized(height=h - 150).with_duration(chat_duration).with_position('center')
text4 = create_text("GHOST MODE: ON 👻\nHide your number from buyers", chat_duration, font_size=28, vertical_pos=880)
clip4_composed = CompositeVideoClip([chat_bg, chat_img, text4])

# 6. Build Clip 5: Outro
print("Processing Clip 5: Outro...")
outro_duration = 4.0
outro_bg = ColorClip(size=(w, h), color=(255, 255, 255), duration=outro_duration)
outro_img = ImageClip(LOGO_PATH).resized(width=300).with_duration(outro_duration).with_position('center')
# Black text for white background outro
text5 = create_text(
    "Cycles, books, kettles & more.\ndormdrop.co.in", 
    outro_duration, 
    font_size=32, 
    vertical_pos=750, 
    color='black', 
    stroke_color=None, 
    stroke_width=0
)
clip5_composed = CompositeVideoClip([outro_bg, outro_img, text5])

# 7. Concatenate all clips
print("Concatenating clips...")
final_clip = concatenate_videoclips([
    clip1_composed,
    clip2_composed,
    clip3_composed,
    clip4_composed,
    clip5_composed
], method="compose")

# 8. Export the final video
print(f"Exporting final video to {OUTPUT_PATH}...")
final_clip.write_videofile(
    OUTPUT_PATH,
    fps=30,
    codec="libx264",
    audio_codec="aac"
)
print("Video export complete!")
