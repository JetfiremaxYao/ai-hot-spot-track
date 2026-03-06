import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库种子初始化...')
  
  // 创建默认关键词
  const keywords = [
    { name: 'GPT-4', description: 'OpenAI GPT-4 最新更新' },
    { name: 'Claude', description: 'Anthropic Claude 模型新闻' },
    { name: 'AI Model', description: '通用AI模型更新' },
    { name: 'Machine Learning', description: '机器学习相关热点' },
    { name: 'Deep Learning', description: '深度学习技术进展' }
  ]
  
  for (const kw of keywords) {
    const existing = await prisma.keyword.findUnique({
      where: { name: kw.name }
    })
    
    if (!existing) {
      await prisma.keyword.create({
        data: {
          name: kw.name,
          description: kw.description,
          status: 'active'
        }
      })
      console.log(`✓ 创建关键词: ${kw.name}`)
    }
  }
  
  console.log('✓ 种子初始化完成！')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 种子初始化失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
