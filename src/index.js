require('dotenv').config();
const puppeteer = require('puppeteer');
const iPhone = puppeteer.KnownDevices['iPhone 6'];
const userAgent = require('./user_agents');

function delay(milliseconds) {
	return new Promise((r) => setTimeout(r, milliseconds));
}

const go_x = async () => {
	let token = process.env.Auth_Token ?? '';
	let tokens = token.split('@');
	const url = process.env.Url;
	console.log(url);
	const brower = await puppeteer.launch({
		headless: false,
		args: [
			'--disable-gpu',
			'--disable-dev-shm-usage',
			'--disable-setuid-sandbox',
			'--no-first-run',
			'--no-sandbox',
			'--no-zygote',
			// "--single-process",
			'--start-maximized',
			'--use-gl=swiftshader',
			'--disable-gl-drawing-for-tests',
		],
		ignoreDefaultArgs: ['--enable-automation'],
	});

	for (const [index, iterator] of tokens.entries()) {
		console.log(`第${index + 1}个账号, 开始操作`);
		const context = await brower.createIncognitoBrowserContext();
		const page = await context.newPage();
		page.setDefaultNavigationTimeout(50 * 1000);

		await page.evaluateOnNewDocument(() => {
			const newProto = navigator.__proto__;
			delete newProto.webdriver;
			navigator.__proto__ = newProto;
		});

		await page.evaluateOnNewDocument(() => {
			window.navigator.chrome = {
				runtime: {},
			};
		});

		await page.emulate(iPhone);
		try {
			// 邀请好友
			await page.setCookie({
				name: 'auth_token',
				value: iterator,
				domain: '.x.com',
			});
			console.log('登录成功');

			console.log('加载页面');
			await Promise.all([
				page.setUserAgent(userAgent.randomByRegex('iPhone')),
				page.setJavaScriptEnabled(true),
				page.goto(url),
				delay(10 * 1000),
			]);

			let article = await page.$$(
				'article > div > div > div:nth-child(3) > div:nth-child(5) div div div:nth-child(2)',
			);

			for (const [index, item] of article.entries()) {
				switch (index) {
					case 2:
						//转发
						console.log('开始转发');
						await item.click();
						await delay(5 * 1000);
						let retweet = await page.$('[data-testid="retweetConfirm"]');
						console.log(retweet);
						await retweet.click();
						await delay(5 * 1000);
						console.log('转发完成');
						break;
					case 3:
						//点赞
						console.log('开始点赞');
						await item.click();
						await delay(5 * 1000);
						console.log('点赞完成');
						break;
					case 4:
						//标签
						console.log('开始标签');
						await item.click();
						await delay(5 * 1000);
						console.log('标签完成');
						break;
				}
			}

			await page.close();

			//等待10秒
			console.log('等待10秒， 加载下一个账号');
			await delay(10 * 1000);
		} catch (error) {
			console.log(error);
			console.log('操作失败');
			await page.close();
		}
	}
	await brower.close();
};

go_x();
