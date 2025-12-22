// 军团相册后端服务器
// 提供图片上传、列表查询、审核管理功能

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/images/gallery')));

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/images/gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 11);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式：JPG, PNG, GIF, WEBP'));
    }
  }
});

// 数据库文件路径（使用 JSON 文件作为简单数据库）
const dbPath = path.join(__dirname, 'gallery.json');

// 读取数据库
const readDB = () => {
  if (!fs.existsSync(dbPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据库失败:', error);
    return [];
  }
};

// 写入数据库
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入数据库失败:', error);
    return false;
  }
};

// ==================== API 接口 ====================

// 1. 图片上传接口
app.post('/api/gallery/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { isAdmin } = req.body; // 前端传递是否为管理员
    const images = readDB();

    const newImage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      showOnHome: false,
      approved: isAdmin === 'true', // 管理员上传默认通过
      uploadTime: new Date().toISOString()
    };

    images.push(newImage);
    writeDB(images);

    res.json({
      success: true,
      message: '上传成功',
      data: newImage
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 2. 获取图片列表接口
app.get('/api/gallery/list', (req, res) => {
  try {
    const { approved, showOnHome } = req.query;
    let images = readDB();

    // 筛选已审核的图片（普通用户）
    if (approved === 'true') {
      images = images.filter(img => img.approved === true);
    }

    // 筛选首页展示的图片
    if (showOnHome === 'true') {
      images = images.filter(img => img.showOnHome === true && img.approved === true);
    }

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败: ' + error.message });
  }
});

// 3. 审核图片接口（管理员）
app.post('/api/gallery/approve/:id', (req, res) => {
  try {
    const { id } = req.params;
    const images = readDB();

    const index = images.findIndex(img => img.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }

    images[index].approved = true;
    writeDB(images);

    res.json({
      success: true,
      message: '审核通过',
      data: images[index]
    });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json({ error: '审核失败: ' + error.message });
  }
});

// 4. 设置首页展示接口（管理员）
app.post('/api/gallery/toggle-home/:id', (req, res) => {
  try {
    const { id } = req.params;
    const images = readDB();

    const index = images.findIndex(img => img.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }

    images[index].showOnHome = !images[index].showOnHome;
    writeDB(images);

    res.json({
      success: true,
      message: images[index].showOnHome ? '已设为首页展示' : '已取消首页展示',
      data: images[index]
    });
  } catch (error) {
    console.error('设置失败:', error);
    res.status(500).json({ error: '设置失败: ' + error.message });
  }
});

// 5. 删除图片接口（管理员）
app.delete('/api/gallery/:id', (req, res) => {
  try {
    const { id } = req.params;
    const images = readDB();

    const index = images.findIndex(img => img.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '图片不存在' });
    }

    const image = images[index];

    // 删除文件
    const filePath = path.join(uploadDir, image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 从数据库删除
    images.splice(index, 1);
    writeDB(images);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// ==================== 成员配置 API ====================

// 成员数据库文件路径
const membersDbPath = path.join(__dirname, '../public/data/members.json');

// 读取成员数据库
const readMembersDB = () => {
  if (!fs.existsSync(membersDbPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(membersDbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取成员数据库失败:', error);
    return [];
  }
};

// 写入成员数据库
const writeMembersDB = (data) => {
  try {
    // 确保目录存在
    const dir = path.dirname(membersDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(membersDbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入成员数据库失败:', error);
    return false;
  }
};

// 1. 获取所有成员配置
app.get('/api/members', (req, res) => {
  try {
    const members = readMembersDB();
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    res.status(500).json({ error: '获取成员列表失败: ' + error.message });
  }
});

// 2. 保存所有成员配置（批量保存）
app.post('/api/members', (req, res) => {
  try {
    const members = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: '数据格式错误：需要数组' });
    }

    const success = writeMembersDB(members);

    if (success) {
      // 为每个成员创建文件夹
      members.forEach(member => {
        const memberDir = path.join(__dirname, '../public/data', member.id);
        if (!fs.existsSync(memberDir)) {
          fs.mkdirSync(memberDir, { recursive: true });
          console.log(`✓ 创建成员文件夹: ${member.id}`);
        }
      });

      res.json({
        success: true,
        message: '成员配置保存成功'
      });
    } else {
      res.status(500).json({ error: '保存失败' });
    }
  } catch (error) {
    console.error('保存成员配置失败:', error);
    res.status(500).json({ error: '保存失败: ' + error.message });
  }
});

// 3. 更新单个成员配置
app.put('/api/members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updatedMember = req.body;
    const members = readMembersDB();

    const index = members.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '成员不存在' });
    }

    members[index] = { ...members[index], ...updatedMember };
    const success = writeMembersDB(members);

    if (success) {
      res.json({
        success: true,
        data: members[index]
      });
    } else {
      res.status(500).json({ error: '更新失败' });
    }
  } catch (error) {
    console.error('更新成员配置失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

// 4. 删除成员
app.delete('/api/members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const members = readMembersDB();

    const index = members.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '成员不存在' });
    }

    // 删除成员数据文件夹
    const memberDir = path.join(__dirname, '../public/data', id);
    if (fs.existsSync(memberDir)) {
      try {
        // 递归删除文件夹及其所有内容
        fs.rmSync(memberDir, { recursive: true, force: true });
        console.log(`✓ 删除成员文件夹: ${id}`);
      } catch (error) {
        console.error(`删除成员文件夹失败 (${id}):`, error);
        // 继续执行，即使文件夹删除失败也要删除配置
      }
    }

    // 从配置中删除成员
    members.splice(index, 1);
    const success = writeMembersDB(members);

    if (success) {
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (error) {
    console.error('删除成员失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// ==================== 申请管理 API ====================

// 申请数据库文件路径
const applicationsDbPath = path.join(__dirname, '../public/data/applications.json');

// 读取申请数据库
const readApplicationsDB = () => {
  if (!fs.existsSync(applicationsDbPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(applicationsDbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取申请数据库失败:', error);
    return [];
  }
};

// 写入申请数据库
const writeApplicationsDB = (data) => {
  try {
    // 确保目录存在
    const dir = path.dirname(applicationsDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(applicationsDbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入申请数据库失败:', error);
    return false;
  }
};

// 1. 获取所有申请
app.get('/api/applications', (req, res) => {
  try {
    const applications = readApplicationsDB();
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('获取申请列表失败:', error);
    res.status(500).json({ error: '获取申请列表失败: ' + error.message });
  }
});

// 2. 提交新申请
app.post('/api/applications', (req, res) => {
  try {
    const application = req.body;
    const applications = readApplicationsDB();

    // 生成 ID 和时间戳
    const newApplication = {
      ...application,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    applications.push(newApplication);
    const success = writeApplicationsDB(applications);

    if (success) {
      res.json({
        success: true,
        data: newApplication
      });
    } else {
      res.status(500).json({ error: '提交失败' });
    }
  } catch (error) {
    console.error('提交申请失败:', error);
    res.status(500).json({ error: '提交失败: ' + error.message });
  }
});

// 3. 审核申请（通过/拒绝）
app.put('/api/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    const applications = readApplicationsDB();

    const index = applications.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '申请不存在' });
    }

    applications[index] = {
      ...applications[index],
      status,
      reviewedAt: new Date().toISOString(),
      reviewNote
    };

    const success = writeApplicationsDB(applications);

    if (success) {
      res.json({
        success: true,
        data: applications[index]
      });
    } else {
      res.status(500).json({ error: '审核失败' });
    }
  } catch (error) {
    console.error('审核申请失败:', error);
    res.status(500).json({ error: '审核失败: ' + error.message });
  }
});

// 4. 删除申请
app.delete('/api/applications/:id', (req, res) => {
  try {
    const { id } = req.params;
    const applications = readApplicationsDB();

    const index = applications.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '申请不存在' });
    }

    applications.splice(index, 1);
    const success = writeApplicationsDB(applications);

    if (success) {
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(500).json({ error: '删除失败' });
    }
  } catch (error) {
    console.error('删除申请失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// ============= 全局配置管理 API =============

const configDbPath = path.join(__dirname, 'config.json');

// 读取全局配置
const readConfigDB = () => {
  try {
    if (fs.existsSync(configDbPath)) {
      const data = fs.readFileSync(configDbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取配置文件失败:', error);
  }
  // 返回默认配置
  return {
    voiceChannelUrl: '',
    voiceChannelName: '军团语音',
    voiceChannelDescription: '点击加入我们的语音频道'
  };
};

// 写入全局配置
const writeConfigDB = (config) => {
  try {
    fs.writeFileSync(configDbPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('写入配置文件失败:', error);
    return false;
  }
};

// 1. 获取全局配置
app.get('/api/config', (req, res) => {
  try {
    const config = readConfigDB();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败: ' + error.message });
  }
});

// 2. 更新全局配置
app.put('/api/config', (req, res) => {
  try {
    const config = req.body;
    const success = writeConfigDB(config);

    if (success) {
      res.json({
        success: true,
        message: '配置更新成功',
        data: config
      });
    } else {
      res.status(500).json({ error: '更新失败' });
    }
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 军团后端服务器启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 图片存储: ${uploadDir}`);
  console.log(`💾 相册数据库: ${dbPath}`);
  console.log(`💾 成员数据库: ${membersDbPath}`);
  console.log(`💾 申请数据库: ${applicationsDbPath}`);
  console.log(`========================================\n`);
});
