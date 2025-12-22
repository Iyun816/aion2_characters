import { useState, useRef } from 'react';
import './GalleryManager.css';

interface GalleryImage {
  id: string;
  src: string;
  name: string;
  showOnHome: boolean;
  approved: boolean;  // 审核状态：true=已审核通过, false=待审核
  uploadTime?: string; // 上传时间
}

// 从 localStorage 读取相册数据
const loadGalleryImages = (): GalleryImage[] => {
  try {
    const saved = localStorage.getItem('legion_gallery');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// 保存相册数据到 localStorage
const saveGalleryImages = (images: GalleryImage[]) => {
  localStorage.setItem('legion_gallery', JSON.stringify(images));
};

const GalleryManager = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(loadGalleryImages);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: GalleryImage = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          src: event.target?.result as string,
          name: file.name,
          showOnHome: false,
          approved: true, // 管理员上传默认审核通过
          uploadTime: new Date().toISOString()
        };
        setGalleryImages(prev => {
          const updated = [...prev, newImage];
          saveGalleryImages(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    // 清空 input 以便再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 切换首页展示
  const toggleShowOnHome = (id: string) => {
    setGalleryImages(prev => {
      const updated = prev.map(img =>
        img.id === id ? { ...img, showOnHome: !img.showOnHome } : img
      );
      saveGalleryImages(updated);
      return updated;
    });
  };

  // 审核通过
  const approveImage = (id: string) => {
    setGalleryImages(prev => {
      const updated = prev.map(img =>
        img.id === id ? { ...img, approved: true } : img
      );
      saveGalleryImages(updated);
      return updated;
    });
  };

  // 拒绝审核（删除图片）
  const rejectImage = (id: string) => {
    if (confirm('确定要拒绝这张图片吗？图片将被删除。')) {
      setGalleryImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        saveGalleryImages(updated);
        return updated;
      });
    }
  };

  // 删除图片
  const deleteImage = (id: string) => {
    if (confirm('确定要删除这张图片吗？')) {
      setGalleryImages(prev => {
        const updated = prev.filter(img => img.id !== id);
        saveGalleryImages(updated);
        return updated;
      });
    }
  };

  return (
    <div className="gallery-manager">
      <div className="gallery-manager__header">
        <div className="gallery-manager__info">
          <h2 className="gallery-manager__title">相册管理</h2>
          <p className="gallery-manager__hint">
            审核用户上传的图片，带有 ⭐ 标记的图片会展示在首页的「成员风采」区域
          </p>
          <div className="gallery-manager__stats">
            <span className="stat-item">
              总计: {galleryImages.length} 张
            </span>
            <span className="stat-item stat-item--pending">
              待审核: {galleryImages.filter(img => !img.approved).length} 张
            </span>
            <span className="stat-item stat-item--approved">
              已通过: {galleryImages.filter(img => img.approved).length} 张
            </span>
          </div>
        </div>
        <div className="gallery-manager__actions">
          <button
            className="gallery-manager__upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            上传图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <div className="gallery-manager__grid">
          {galleryImages.map(img => (
            <div key={img.id} className={`gallery-manager__item ${!img.approved ? 'gallery-manager__item--pending' : ''}`}>
              <div className="gallery-manager__item-image">
                <img
                  src={img.src}
                  alt={img.name}
                  onClick={() => setSelectedImage(img.src)}
                />
                {!img.approved && (
                  <div className="gallery-manager__item-badge gallery-manager__item-badge--pending">
                    <span>⏳</span>
                    <span>待审核</span>
                  </div>
                )}
                {img.approved && img.showOnHome && (
                  <div className="gallery-manager__item-badge">
                    <span>⭐</span>
                    <span>首页展示</span>
                  </div>
                )}
              </div>
              <div className="gallery-manager__item-info">
                <span className="gallery-manager__item-name" title={img.name}>
                  {img.name}
                </span>
              </div>
              <div className="gallery-manager__item-actions">
                {!img.approved ? (
                  <>
                    <button
                      className="gallery-manager__approve-btn"
                      onClick={() => approveImage(img.id)}
                      title="审核通过"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      通过审核
                    </button>
                    <button
                      className="gallery-manager__reject-btn"
                      onClick={() => rejectImage(img.id)}
                      title="拒绝审核"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      拒绝
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`gallery-manager__star-btn ${img.showOnHome ? 'gallery-manager__star-btn--active' : ''}`}
                      onClick={() => toggleShowOnHome(img.id)}
                      title={img.showOnHome ? '取消首页展示' : '设为首页展示'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {img.showOnHome ? '取消首页展示' : '设为首页展示'}
                    </button>
                    <button
                      className="gallery-manager__delete-btn"
                      onClick={() => deleteImage(img.id)}
                      title="删除图片"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 4 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="gallery-manager__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>还没有上传任何图片</p>
          <p className="gallery-manager__empty-hint">点击上方按钮上传军团的精彩瞬间</p>
        </div>
      )}

      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div className="gallery-manager__lightbox" onClick={() => setSelectedImage(null)}>
          <button className="gallery-manager__lightbox-close" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img src={selectedImage} alt="预览" />
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
