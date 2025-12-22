import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Members.css';

interface GalleryImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  showOnHome: boolean;
  approved: boolean;
}

const Members = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadHomeGalleryImages();
  }, []);

  // 从后端加载首页展示的图片
  const loadHomeGalleryImages = async () => {
    try {
      const response = await fetch('/api/gallery/list?showOnHome=true');
      const data = await response.json();
      if (data.success) {
        setGalleryImages(data.data);
      }
    } catch (error) {
      console.error('加载首页相册失败:', error);
    }
  };

  return (
    <section id="members" className="members">
      <div className="members__container">
        <div className="members__header">
          <span className="members__label">成员风采</span>
          <h2 className="members__title">一起奋战的伙伴们</h2>
          <p className="members__subtitle">
            每一位成员都是椿夏的宝贵财富
          </p>
        </div>

        {/* 图片展示区 */}
        {galleryImages.length > 0 ? (
          <div className="members__gallery">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="members__gallery-item"
                onClick={() => setSelectedImage(img.url)}
              >
                <img src={img.url} alt={img.originalName} loading="lazy" />
              </div>
            ))}
          </div>
        ) : (
          <div className="members__empty-gallery">
            <p>📷 精彩瞬间即将上传...</p>
            <p className="members__empty-hint">
              想了解军团的详细信息?
            </p>
          </div>
        )}

        <div className="members__cta">
          <p>想了解军团的详细信息？</p>
          <Link to="/legion" className="members__cta-btn">
            查看军团信息
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div className="members__lightbox" onClick={() => setSelectedImage(null)}>
          <button className="members__lightbox-close" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="预览" />
        </div>
      )}
    </section>
  );
};

export default Members;
