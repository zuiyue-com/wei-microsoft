const puppeteer = require('puppeteer');
const fs = require('fs');
const fswrite = require('fs/promises'); // replace this line

function checkOpen() {
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const contents = fs.readFileSync('../data/daemon', 'utf8').trim();
    const fileTimestamp = Number(contents) + 180;
    return nowTimestamp < fileTimestamp;
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

async function login() {
    if (!checkOpen()) {
        console.log("暂时没有开启,继续等待下一次运行.");
        await delay(1000);
        return;
    }

    let entries = fs.readdirSync("../cookie");
    if (entries.length >= 3) {
        console.log("cookie entries.count() >= 3");
        await delay(1000);
        return;
    }

    let data = fs.readFileSync('../data/userinfo', 'utf8');
    let info = JSON.parse(data);
    console.log(`user: ${info.user}, pass: ${info.pass}`);

    console.log("Browser new tab()");
    const browser = await puppeteer.launch({
        //headless: false, 
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    const page = await browser.newPage();

    console.log("login page");
    await page.goto('https://sgmsupply.login.covisint.com/login.do?host=https://sgmsupply.portal.covisint.com&ct_orig_uri=%2F');
    await page.click('input[name="user"]');
    await page.keyboard.type(info.user.trim());
    await page.click('input[name="password"]');
    await page.keyboard.type(info.pass.trim());

    const xpathExpression = '/html/body/section/div/div/form/div[3]/div/img';
    const elements = await page.$x(xpathExpression);
    const png_data = await elements[0].screenshot({type: 'png'});
    
    await fswrite.writeFile('../tmp/screenshot.png', png_data);

    let verifycode = await ttshitu('../tmp/screenshot.png');

    console.log("verify code: " + verifycode);

    await page.click('input[name="vrfycode"]');
    await page.keyboard.type(verifycode);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();

    let body_text = await page.$eval('body', body => body.innerText);

    if (!body_text.includes("我的应用")) {
        console.log(body_text);
        console.log("登录失败,没有包含\"我的应用\".继续重试");
        await browser.close();
        return;
    }

    console.log("idp page");
    await page.goto('https://sgmsupply.broker.covisint.com/fed/app/idp.saml20?entityID=https://sp.saic-gm.com/spsaml/newgpsc&TARGET=https://sgmsupply.broker.covisint.com/fed/app/idp.saml20?entityID=https://sp.saic-gm.com/spsaml/newgpsc&spIntTest=true&TARGET=https%3A%2F%2Fsgmsupply.broker.covisint.com%2Fadmin%2Fapp%2FintVerification.do%3FproviderID%3D13039119%26providerType%3Dsp');
    await page.waitForNavigation();
    await delay(5000);

    await page.screenshot({path: '../tmp/screenshot1.png'});

    body_text = await page.$eval('body', body => body.innerText);
    if (!body_text.includes("RFQ编号")) {
        console.log(body_text);
        console.log("登录失败,没有包含\"RFQ编号\".继续重试");
        await browser.close();
        return;
    }

    const cookies = await page.cookies();
    let cookies_str = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join(';');

    let file_name = `../cookie/${Date.now()}`;
    fs.writeFileSync(file_name, cookies_str);
    console.log("登录成功!");

    await browser.close();
}

async function index() {

}

index();