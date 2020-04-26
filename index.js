require('dotenv').config();
const Telegraf = require('telegraf');
const Markup = Telegraf.Markup;
const LocalSession = require('telegraf-session-local');
const RateLimit = require('telegraf-ratelimit')
// @ts-ignore
const bot = new Telegraf(process.env.BOT_TOKEN);

// Set limit to 1 message per 3 seconds
const limitConfig = {
    window: 3000,
    limit: 1,
    onLimitExceeded: (ctx, next) => {},
  }

const localSession = new LocalSession({
    getSessionKey: (ctx) => {
        if (!ctx.from || !ctx.chat) {
            return
        }
        return `${ctx.chat.id}`;
    },
    database: 'pinglist.json',
    storage: LocalSession.storageFileAsync,
    format: {
        serialize: (obj) => JSON.stringify(obj),
        deserialize: (str) => JSON.parse(str),
    },
});

const hasAdded = async (ctx) => {
    return ctx.session.users && ctx.session.users.findIndex(user => user.id === ctx.from.id) > -1;
};

bot.use(RateLimit(limitConfig))
bot.use(localSession.middleware())
bot.command('pingmoko', async (ctx, next) => {
    if (await hasAdded(ctx)) {
        await ctx.reply(`Your name's been added.`);
        return next();
    }
    const user = { 
                id: ctx.from.id,
                name: ctx.from.first_name
            };
    ctx.session.users = ctx.session.users 
        ? [...ctx.session.users, user] : [user];
    await ctx.replyWithMarkdown(`[${ctx.from.first_name}](tg://user?id=${ctx.from.id}) added to ping list.`);
    return next()
})

bot.command('hoylaro', async (ctx, next) => {
    
    if (ctx.session.users && ctx.session.users.length) {
        const namelist = ctx.session.users.reduce((acc, curr) => `[${curr.name}](tg://user?id=${curr.id}), ${acc}`, "")
        ctx.replyWithMarkdown(`__HOY LARO!__\n${namelist}`);
        return next();
    }

    await ctx.replyWithMarkdown('😢 No one wants to play with you. Sadlife.')
    return next();
})

bot.command('yokoping', async (ctx, next) => {
    const userIndex = ctx.session.users.findIndex(u => u.id === ctx.from.id);
    if (userIndex > -1) {
        const newList = [...ctx.session.users];
        newList.splice(userIndex, 1);
        ctx.session.users = [...newList];

        ctx.reply(`Yeeeeeeeeted ${ctx.from.first_name} from the annoy list`);
        return next();
    }

    await ctx.reply(`${ctx.from.id} is not on the list`)
    return next();
})

bot.command('chickin', async (ctx, next) => {
    ctx.sessionDB.update('chickin', c => c + 1).write();
    ctx.replyWithMarkdown(`Chickin cravings ni [🌙](tg://user?id=${1029874100}): ${ctx.sessionDB.get('chickin').value()}`)
})

bot.command('hakdog', async ctx => {
    ctx.sessionDB.update('hakdog', c => c + 1).write();
    ctx.replyWithMarkdown(`Hakdog cravings ni [Mars](tg://user?id=${336554853}): ${ctx.sessionDB.get('hakdog').value()}`);
})

bot.help(ctx => {
    return ctx.replyWithMarkdown(`
    Roll call pinging service
    /pingmoko - Add sa G na G maglaro 
    /hoylaro - TAWAGIN ANG MADLA
    /yokoping - pag ayaw paistorbo. KJ
    /hakdog - Gusto daw ni mars
    /chickin - Gusto ni Moon with wings
    `);
})

bot.launch()