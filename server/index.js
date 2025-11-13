const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const app = express();
const httpServer = createServer(app);

// 1. 基础配置：解析JSON请求、CORS跨域（全球访问兼容）
app.use(express.json());
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // 生产环境建议限制具体域名
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// 2. 模型配置：支持多模型切换（开源优先，兼容闭源）
const AI_MODELS = {
  openai: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini" // 轻量版适合初期测试，成本更低
  },
  open_source: {
    apiUrl: "https://api.groq.com/openai/v1/chat/completions", // 开源模型API示例（Groq部署Llama3）
    model: "llama3-70b-8192"
  }
};
const DEFAULT_MODEL = "open_source"; // 优先使用开源模型

// 3. 核心API：全球知识检索（支持多语言、模型切换）
app.get('/api/knowledge/search', async (req, res) => {
  const { 
    query, 
    language = 'en', 
    model = DEFAULT_MODEL, // 允许用户指定模型
    sources = false // 是否返回知识来源
  } = req.query;

  // 输入验证：防止空查询
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: '查询内容不能为空', code: 'EMPTY_QUERY' });
  }

  // 语言过滤：只支持预设的主流语言
  const SUPPORTED_LANGUAGES = ['zh', 'en', 'es', 'fr', 'ru', 'ar', 'de', 'ja'];
  const validLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';

  try {
    // 选择模型配置
    const modelConfig = AI_MODELS[model] || AI_MODELS[DEFAULT_MODEL];
    const apiKey = model === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.GROQ_API_KEY; // 区分不同模型的API密钥

    if (!apiKey) {
      throw new Error(`未配置${model}模型的API密钥`);
    }

    // 调用AI模型：构建多语言提示词
    const response = await axios.post(modelConfig.apiUrl, {
      model: modelConfig.model,
      messages: [
        { 
          role: "system", 
          content: `你是全球知识库的AI助手，需用${validLanguage}回答问题。回答需准确、中立，若涉及宗教、文化内容，需尊重多样性并注明不同视角。` 
        },
        { role: "user", content: query }
      ],
      temperature: 0.2, // 低随机性，确保知识准确性
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 15000 // 15秒超时（适配全球网络）
    });

    // 构建响应：包含知识来源（模拟，后续可对接真实知识库）
    const result = {
      answer: response.data.choices[0].message.content,
      language: validLanguage,
      model: modelConfig.model,
      requestId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5) // 唯一请求ID
    };

    // 若需要来源，附加模拟数据（实际项目需对接知识图谱）
    if (sources) {
      result.sources = [
        { type: "encyclopedia", title: "Global Knowledge Encyclopedia (2025)" },
        { type: "academic", title: "Cross-Cultural Studies Quarterly" }
      ];
    }

    res.json(result);

  } catch (error) {
    // 细化错误处理：区分网络错误、API错误、超时等
    console.error(`[知识检索错误] ${error.message}`);
    const errorResponse = {
      error: error.message.includes('timeout') 
        ? '请求超时，请检查网络或稍后重试' 
        : '知识检索失败，请尝试其他查询',
      code: error.response?.status || 'SERVER_ERROR'
    };
    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// 4. 实时协作：全球开发者知识贡献通知
io.on('connection', (socket) => {
  console.log(`新贡献者连接：${socket.id}（来自${socket.handshake.address}）`);

  // 监听知识贡献事件
  socket.on('knowledge_contribution', (data) => {
    const { topic, content, language, contributor } = data;
    if (!topic || !content) return; // 过滤无效贡献

    // 广播给所有在线开发者
    io.emit('new_contribution', {
      id: Date.now(),
      topic,
      language: language || 'en',
      contributor: contributor || `anonymous_${socket.id.slice(0, 6)}`,
      time: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`贡献者断开连接：${socket.id}`);
  });
});

// 5. 启动服务：支持端口配置（适配容器化部署）
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🌐 GlobalAI 知识服务启动成功：http://localhost:${PORT}`);
  console.log(`🔍 支持模型：${Object.keys(AI_MODELS).join(', ')}`);
  console.log(`🌍 支持语言：${SUPPORTED_LANGUAGES.join(', ')}`);
});

module.exports = httpServer;
