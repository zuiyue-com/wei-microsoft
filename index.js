const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fswrite = require('fs/promises'); // replace this line

async function index() {
    console.log("Browser new tab()");
    const browser = await puppeteer.launch({
        headless: false, 
        //headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    const page = await browser.newPage();
    await load_cookie(page);

    await page.goto("https://www.microsoft.com/en-us/wdsi/filesubmission", {timeout: 120*1000})

    await login(page);


    await browser.close();
}

index();

async function login(page) {
    require('dotenv').config()
    const username = process.env.EMAIL
    const password = process.env.PASSWORD
    console.log(`Username: ${username}, Password: ${password}`)

    // 如果 #mectrl_currentAccount_secondary 里面包含了uesrname，说明已经登录了

    let xpath = '//*[@id="mectrl_headerPicture"]';
    await page.waitForXPath(xpath); 
    let elements = await page.$x(xpath);
    await elements[0].click();

    // 判断当前url是不是submit
    let url = await page.url();
    if (url.includes("filesubmission")) {
        console.log("已经登录，不需要再登录");
        return;
    }
    
    // 帐号
    xpath = '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div[1]/div[3]/div/div/div/div[2]/div[2]/div/input[1]';
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();
    await page.keyboard.type(username);

    // 下一步
    xpath = '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div[1]/div[3]/div/div/div/div[4]/div/div/div/div[2]/input';
    await page.waitForXPath(xpath);
    elements = await page.$x(xpath);
    await elements[0].click();

    // 密码
    xpath = '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div/div[2]/input'
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();
    await page.keyboard.type(password);

    // 下一步
    xpath = '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[4]/div[2]/div/div/div/div/input';
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();

    // 不再显示此消息
    xpath = '/html/body/div/form/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div[1]/div/label/input';
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();
    
    // 是
    xpath = '/html/body/div/form/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div[2]/div/div/div[2]/input';
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();

    await save_cookie(page);
}

async function load_cookie(page) {
    try {
        const cookiesString = await fs.readFile('./cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
    } catch (_) {}
}

async function save_cookie(page) {
    // 获取 cookies
    const cookies = await page.cookies();
    // 将 cookies 保存到文件
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
