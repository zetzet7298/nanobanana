# HƯỚNG DẪN SỬ DỤNG - AI Content Generator

## Mục Lục

1. [Giới thiệu](#giới-thiệu)
2. [Cách sử dụng](#cách-sử-dụng)
3. [Các loại content](#các-loại-content)
4. [Ví dụ prompt](#ví-dụ-prompt)
5. [Import vào các platform](#import-vào-các-platform)

---

## Giới Thiệu

Bộ công cụ này giúp bạn tạo nội dung marketing có cấu trúc JSON, dễ dàng:

- Import vào các tool scheduling (Buffer, Hootsuite, Later, Publer)
- Tự động đăng qua API
- Quản lý content calendar
- Bulk upload lên các nền tảng

### Các file trong thư mục này:

| File                                     | Mô tả                                      |
| ---------------------------------------- | ------------------------------------------ |
| `SYSTEM_PROMPT_CONTENT_GENERATOR.md`     | System prompt chính + JSON schemas         |
| `json_templates/platform_templates.json` | Templates cho từng platform với specs 2025 |
| `json_templates/example_outputs.json`    | Ví dụ output mẫu                           |

---

## Cách Sử Dụng

### Bước 1: Setup AI Agent

Copy phần **SYSTEM PROMPT** từ file `SYSTEM_PROMPT_CONTENT_GENERATOR.md` vào AI agent của bạn:

- ChatGPT (Custom Instructions hoặc System Prompt)
- Claude (System Prompt)
- Gemini (System Prompt)
- Hoặc bất kỳ AI agent nào khác

### Bước 2: Chọn Platform & Content Type

Xác định bạn cần tạo content cho platform nào:

| Platform  | Content Types               |
| --------- | --------------------------- |
| TikTok    | Video (9:16), max 10 phút   |
| Instagram | Feed, Story, Reel, Carousel |
| Facebook  | Post, Reel, Carousel, Ad    |
| YouTube   | Short, Long-form            |
| Zalo      | OA Post, Reel               |
| Website   | Blog, Article               |

### Bước 3: Gửi Prompt

Format prompt như sau:

```
Tạo [LOẠI CONTENT] cho [PLATFORM] về "[CHỦ ĐỀ]"
Trả về JSON theo schema: [TÊN SCHEMA]
[YÊU CẦU BỔ SUNG NẾU CÓ]
```

### Bước 4: Nhận Output JSON

AI sẽ trả về JSON có cấu trúc, bạn có thể:

- Copy và parse JSON
- Import vào tool scheduling
- Sử dụng cho content calendar
- Gửi qua API để đăng tự động

---

## Các Loại Content

### 1. Blog Post / Bài viết

**Use case:** Website, SEO content

```
Tạo blog post cho website về "Kinh nghiệm du lịch Bình Hưng từ A-Z"
Trả về JSON theo schema: BLOG POST
```

**Output bao gồm:**

- Title, slug, excerpt
- Body content (headings, paragraphs, lists, CTAs)
- SEO metadata (meta title, description, keywords)
- Schema markup (JSON-LD)
- Featured image prompt

---

### 2. Social Media Post

**Use case:** Facebook, Instagram, Zalo, LinkedIn

```
Tạo post Facebook về "Flash Sale Tour Bình Hưng cuối tuần"
Platform: facebook_page
Trả về JSON theo schema: SOCIAL MEDIA POST
```

**Output bao gồm:**

- Caption (full và short version)
- Hashtags array
- CTA với button type
- Location data
- Media prompts với specs
- Schedule suggestion

---

### 3. Video Content (Reels/Shorts/TikTok)

**Use case:** Instagram Reels, Facebook Reels, YouTube Shorts, TikTok

```
Tạo Instagram Reel về "Lặn ngắm san hô Hòn Sam"
Platform: instagram_reel
Duration: 15 giây
Trả về JSON theo schema: VIDEO CONTENT
```

**Output bao gồm:**

- Concept (title, hook, mood)
- Script từng scene (timestamp, visual, audio, text overlay, transition)
- Video specs (duration, resolution, fps, format)
- Audio suggestion
- Caption và hashtags

---

### 4. Carousel / Slideshow

**Use case:** Instagram Carousel, Facebook Carousel, LinkedIn

```
Tạo carousel 6 slides về "Top 5 món hải sản Bình Hưng"
Platform: instagram_carousel
Trả về JSON theo schema: CAROUSEL
```

**Output bao gồm:**

- Array các slides (cover, content, CTA)
- Image prompt cho mỗi slide
- Headline, body text
- Post caption và hashtags

---

### 5. Image Content

**Use case:** Single images, banners, thumbnails

```
Tạo ảnh thumbnail YouTube về "Tour Bình Hưng 2N1Đ"
Platform: youtube_thumbnail
Trả về JSON theo schema: IMAGE CONTENT
```

**Output bao gồm:**

- AI image prompt (positive + negative)
- Style setting
- Specs (dimensions, format)
- Text overlay suggestions
- Branding elements

---

### 6. Advertising Copy

**Use case:** Facebook Ads, Google Ads, TikTok Ads

```
Tạo Facebook Ad conversion về "Tour Bình Hưng 1 ngày"
Platform: facebook_ads
Target: Người yêu thích du lịch biển
Trả về JSON theo schema: ADVERTISING COPY
```

**Output bao gồm:**

- Multiple headlines (với character count)
- Descriptions
- Primary text
- CTA button
- Creative prompt
- Targeting suggestion

---

## Ví Dụ Prompt Chi Tiết

### Ví dụ 1: TikTok Video

```
Tạo TikTok video về "Ăn tôm hùm giá rẻ ở Bình Hưng"
Platform: tiktok
Duration: 15 giây
Style: Mukbang + Travel reveal
Hook: Câu hỏi gây tò mò về giá
Trả về JSON theo schema: VIDEO CONTENT
```

### Ví dụ 2: Instagram Carousel

```
Tạo Instagram carousel 5 slides
Chủ đề: "5 lý do phải đến Bình Tiên hè này"
Platform: instagram_carousel
Style: Clean, modern, travel aesthetic
Trả về JSON theo schema: CAROUSEL
```

### Ví dụ 3: Facebook Ad

```
Tạo Facebook Ad cho campaign awareness
Product: Tour Bình Hưng 2N1Đ giá 1.300.000đ
Target audience: Cặp đôi, gia đình trẻ
USP: Lịch trình đa dạng, hải sản tươi, hướng dẫn bản địa
Trả về JSON theo schema: ADVERTISING COPY
```

### Ví dụ 4: SEO Blog Post

```
Tạo blog post SEO về "Bãi Bà Bóng Bình Tiên - Hidden Gem Cam Ranh"
Platform: website
Target keyword: "Bãi Bà Bóng", "Bình Tiên"
Word count: 1500 từ
Include: Tips check-in, cách di chuyển, thời điểm đẹp nhất
Trả về JSON theo schema: BLOG POST
```

---

## Import Vào Các Platform

### Buffer / Hootsuite / Later

1. Export JSON output
2. Parse thành format CSV:
   - Column: Platform, Date, Time, Caption, Media_URL, Hashtags
3. Bulk upload qua dashboard

### WordPress

1. Lấy phần `body` từ blog post JSON
2. Convert thành HTML hoặc Gutenberg blocks
3. Import metadata vào Yoast SEO

### Facebook Business Suite

1. Sử dụng Facebook Graph API
2. Map JSON fields vào API parameters:

```javascript
{
  message: content.caption,
  link: content.cta.url,
  scheduled_publish_time: schedule.publish_date
}
```

### Automation Tools (n8n, Zapier, Make)

1. Tạo workflow nhận JSON input
2. Parse và route đến các platform tương ứng
3. Schedule posts tự động

---

## Platform Specs Quick Reference (2025)

| Platform  | Aspect Ratio | Resolution           | Duration | Caption     |
| --------- | ------------ | -------------------- | -------- | ----------- |
| TikTok    | 9:16         | 1080x1920            | 1s-10min | 2200 chars  |
| IG Reels  | 9:16         | 1080x1920            | 3-90s    | 2200 chars  |
| IG Feed   | 1:1, 4:5     | 1080x1080, 1080x1350 | -        | 2200 chars  |
| FB Reels  | 9:16         | 1080x1920            | 3-90s    | 2200 chars  |
| FB Post   | 1.91:1       | 1200x630             | -        | 63206 chars |
| YT Shorts | 9:16         | 1920x1080            | max 3min | 100 title   |
| Zalo      | 9:16         | 1080x1920            | max 60s  | 2000 chars  |

---

## Tips & Best Practices

### 1. Batch Content Creation

Tạo nhiều content cùng lúc bằng cách gửi batch prompt:

```
Tạo 5 Instagram posts về các chủ đề sau:
1. Bãi Đá Trứng check-in
2. Lặn san hô Hòn Sam
3. BBQ hải sản trên bè
4. Hoàng hôn Bình Tiên
5. Review tour 2N1Đ

Trả về mỗi post theo JSON schema: SOCIAL MEDIA POST
```

### 2. Multi-Platform Repurposing

Tạo 1 nội dung, xuất ra nhiều format:

```
Tạo content về "Tour Bình Hưng 1 ngày" cho:
- Instagram Reel (15s)
- TikTok (15s)
- Facebook Post
- YouTube Short (30s)

Mỗi platform trả về JSON riêng theo schema phù hợp
```

### 3. Content Calendar

Tạo lịch content theo tuần/tháng:

```
Tạo content calendar tháng 1/2025 cho Hồng Nhàn Tour
- 3 posts/tuần cho Facebook
- 5 Reels/tuần cho Instagram
- 7 TikToks/tuần

Chủ đề xoay vòng: Tour, Ẩm thực, Check-in, Tips, Testimonial

Trả về JSON array với schedule dates
```

---

_Cập nhật: Tháng 12/2025_
_Phiên bản: 1.0_
