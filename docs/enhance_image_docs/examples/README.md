# 📁 Ví dụ cấu hình Enhancement Config

Thư mục này chứa các file cấu hình mẫu cho các loại hình doanh nghiệp khác nhau. Bạn có thể sử dụng trực tiếp hoặc tùy chỉnh theo nhu cầu.

## 📋 Danh sách cấu hình

| File | Loại hình | Mô tả |
|------|-----------|-------|
| `config-real-estate.json` | Bất động sản | Căn hộ, nhà phố, biệt thự, văn phòng, BĐS cao cấp |
| `config-restaurant.json` | Nhà hàng | Fine dining, casual, ẩm thực Việt, café & bakery |
| `config-ecommerce.json` | Thương mại điện tử | Thời trang, lifestyle, mỹ phẩm, flatlay |
| `config-spa-wellness.json` | Spa & Wellness | Spa cao cấp, yoga, salon, spa truyền thống |

## 🚀 Cách sử dụng

### 1. Copy file cấu hình

```bash
# Copy config mẫu vào thư mục mcp-server
cp docs/enhance_image_docs/examples/config-restaurant.json mcp-server/enhancement-config.json
```

### 2. Hoặc sử dụng trực tiếp với tham số `configFile`

```bash
# Khi gọi enhance_image, chỉ định file config
enhance_image --configFile="docs/enhance_image_docs/examples/config-spa-wellness.json" --preset="spa-luxury"
```

### 3. Tùy chỉnh theo doanh nghiệp

1. Copy file mẫu phù hợp nhất
2. Đổi tên theo doanh nghiệp: `enhancement-config.tendongnghiep.json`
3. Chỉnh sửa các thông số theo nhu cầu

## 📝 Cấu trúc file config

```json
{
  "$schema": "../../../mcp-server/enhancement-config.schema.json",
  "version": "1.0.0",
  "activePreset": "preset-name",           // Preset mặc định
  
  "globalSettings": {
    "analyzerModel": "gemini-2.5-flash",   // Model phân tích
    "enhancerModel": "gemini-2.5-flash-image", // Model enhance
    "outputFormat": "png",                  // Định dạng output
    "maxConcurrentImages": 3,               // Số ảnh xử lý đồng thời
    "saveAnalysisReport": true,             // Lưu báo cáo phân tích
    "locale": "vi-VN",                      // Ngôn ngữ
    "organizeByCategory": true              // Sắp xếp theo category
  },

  "categories": {
    "category-id": {
      "name": "Category Name",              // Tên tiếng Anh
      "nameVi": "Tên tiếng Việt",           // Tên tiếng Việt
      "keywords": ["keyword1", "keyword2"], // Từ khóa nhận diện
      "folderName": "ten-thu-muc"           // Tên thư mục output
    }
  },
  
  "presets": {
    "preset-id": {
      "name": "Tên preset",
      "description": "Mô tả preset",
      "systemPrompt": {
        "analysis": "Prompt phân tích ảnh...",
        "enhancement": "Prompt cải thiện ảnh..."
      },
      "enhancementRules": {
        "addPeopleIfEmpty": true,           // Thêm người nếu ảnh trống
        "peopleEthnicity": "Vietnamese",    // Dân tộc người được thêm
        "peopleStyle": "mô tả phong cách",  // Phong cách người
        "peopleTypes": [                    // Các loại người
          "family with children",
          "young couple"
        ],
        "colorEnhancement": "mô tả màu sắc",
        "lightingStyle": "mô tả ánh sáng"
      }
    }
  },
  
  "customPrompts": {
    "enabled": false,                       // Bật prompt tùy chỉnh
    "analysisPrompt": "",
    "enhancementPrompt": ""
  }
}
```

## 🎯 Chi tiết từng config

### 🏠 Bất động sản (`config-real-estate.json`)

**Presets có sẵn:**
- `real-estate-residential` - Nhà ở: căn hộ, nhà phố, biệt thự
- `real-estate-commercial` - Thương mại: văn phòng, mặt bằng
- `real-estate-luxury` - Cao cấp: villa, penthouse, branded residence

**Categories:** Mặt tiền, phòng khách, phòng ngủ, phòng tắm, bếp, ban công, hồ bơi, tiện ích, sơ đồ, toàn cảnh

---

### 🍽️ Nhà hàng (`config-restaurant.json`)

**Presets có sẵn:**
- `restaurant-fine-dining` - Fine dining, ẩm thực cao cấp
- `restaurant-casual` - Nhà hàng phổ thông, gia đình
- `restaurant-vietnamese` - Ẩm thực Việt Nam truyền thống
- `restaurant-cafe` - Quán cà phê, tiệm bánh

**Categories:** Món chính, khai vị, tráng miệng, đồ uống, nội thất, mặt tiền, bếp, phục vụ, sự kiện

---

### 🛒 Thương mại điện tử (`config-ecommerce.json`)

**Presets có sẵn:**
- `ecommerce-fashion` - Thời trang, quần áo
- `ecommerce-lifestyle` - Ảnh lifestyle product
- `ecommerce-beauty` - Mỹ phẩm, làm đẹp
- `ecommerce-flatlay` - Flatlay, product arrangement

**Categories:** Thời trang nữ/nam, phụ kiện, giày dép, điện tử, làm đẹp, nhà cửa, thực phẩm, lifestyle

---

### 💆 Spa & Wellness (`config-spa-wellness.json`)

**Presets có sẵn:**
- `spa-luxury` - Spa cao cấp, resort spa
- `spa-wellness-center` - Yoga, fitness, wellness
- `spa-beauty-salon` - Salon tóc, nail, làm đẹp
- `spa-traditional` - Spa truyền thống Việt Nam

**Categories:** Phòng trị liệu, massage, chăm sóc da, nail, tóc, xông hơi, yoga/fitness, sản phẩm, lễ tân, hồ bơi

## 💡 Tips tùy chỉnh

### Thay đổi người trong ảnh

```json
"enhancementRules": {
  "addPeopleIfEmpty": true,
  "peopleEthnicity": "Vietnamese",
  "peopleTypes": [
    "gia đình có con nhỏ",
    "cặp đôi trẻ",
    "nhóm bạn bè"
  ]
}
```

### Điều chỉnh tone màu

```json
"colorEnhancement": "warm inviting tones, bright and airy"
// hoặc
"colorEnhancement": "moody dramatic, rich colors"
// hoặc  
"colorEnhancement": "natural, authentic Vietnamese"
```

### Thay đổi phong cách ánh sáng

```json
"lightingStyle": "natural window light, golden hour"
// hoặc
"lightingStyle": "studio lighting, soft shadows"
// hoặc
"lightingStyle": "candlelight ambiance, warm"
```

## 📞 Hỗ trợ

Nếu cần tạo config mới cho loại hình doanh nghiệp khác, hãy liên hệ hoặc tham khảo các file mẫu để tự tạo.

---

*Cập nhật: 2024*
