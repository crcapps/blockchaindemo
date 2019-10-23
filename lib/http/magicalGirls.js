const { generator, parse } = require('../magicalGirl')

const generateMagicalGirl = generator()

module.exports = {
  resourceName: 'magicalgirl',
  getRandom: async (ctx) => {
    const nextGirl = await generateMagicalGirl.next()
    magicalGirl = nextGirl.value
    ctx.body = { magicalGirl }
  },

  getById: async (ctx, id) => {
    const magicalGirl = await parse(id)
    ctx.body = { magicalGirl }
  }
}
