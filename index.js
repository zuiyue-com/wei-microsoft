const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fswrite = require('fs/promises'); // replace this line

async function index() {
    console.log("Browser new tab()");
    const browser = await puppeteer.launch({
        headless: false, // headless: 'new',
        defaultViewport: null,
        userDataDir: './cache',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    const pages = await browser.pages();
    const page = pages[0];
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');

    await page.goto("https://www.microsoft.com/en-us/wdsi/filesubmission", {timeout: 120*1000})

    await login(page);

    await filesubmission(page, '../wei-release/windows/latest/data/wei-qbittorrent.exe');

    await delay(600000);

    await browser.close();
}

index();


async function filesubmission(page, file_path) {

    // 点击 Software developer
    await click(page, '/html/body/div[2]/main[1]/section/div[2]');

    // 点击 Continue
    await click(page, '/html/body/div[2]/main[1]/section/div[3]/button');

    // Select the Microsoft security product used to scan the file *
    await click(page, '/html/body/div[2]/main[3]/section[2]/div[2]/div/form/input');
    await click(page, '/html/body/div[2]/main[3]/section[2]/div[2]/div/form/div[2]/ul/li[3]/span');

    // Company Name *
    await click(page, '/html/body/div[2]/main[3]/section[3]/div[3]/div/input');
    await page.keyboard.type('ZUIYUE.COM');

    // Upload File
    let xpath = '/html/body/div[2]/main[3]/section[10]/div[3]/form/div/div[1]/input[1]'
    await page.waitForXPath(xpath); 
    const inputElementHandles = await page.$x(xpath);
    await inputElementHandles[0].uploadFile(file_path);

    // Should this file be removed from our database at a certain date?
    await click(page, '/html/body/div[2]/main[3]/section[11]/div[2]/div[1]/div[1]/fieldset/label[2]/span');

    // What do you believe this file is?
    // Incorrectly detected as PUA (potentially unwanted application)
    await click(page, '/html/body/div[2]/main[3]/section[12]/div[2]/div/fieldset/div/label[4]/span');
    
    // Detection name *
    await click(page, '/html/body/div[2]/main[3]/section[13]/div[1]/div[2]/input');

    // Trojan: Win32/Wacatac.D!ml
    await page.keyboard.type('Trojan: Win32/Wacatac.D!ml');

    // Additional information *
    await click(page, '/html/body/div[2]/main[3]/section[14]/div[1]/div[2]/div/div/textarea');
    await page.keyboard.type('There is a false positive for my software. Please re-check it and remove it from your virus list. Our official website is: https://www.zuiyue.com. Thanks very much!');

    // Continue
    await click(page, '/html/body/div[2]/main[3]/section[14]/div[2]/div/button');

    // Submit
    await click(page, '/html/body/div[2]/main[4]/section[2]/div/div/button[2]');

    await page.waitForNavigation({ timeout: 120*1000 });

    await page.goto("https://www.microsoft.com/en-us/wdsi/filesubmission", {timeout: 120*1000});
    await page.waitForNavigation();
}

async function login(page) {
    require('dotenv').config()
    const username = process.env.EMAIL
    const password = process.env.PASSWORD
    console.log(`Username: ${username}, Password: ${password}`)

    // 点击右上角头像
    let xpath = '//*[@id="mectrl_headerPicture"]';
    await click(page, xpath);

    // 如果页面里面包含了 username，说明已经登录了
    xpath = '/html/body/div[1]/div/div/header/div/div/div[4]/div[2]/div/div/div/div/div[1]/div[3]/div/div[2]';
    // xpath = '//*[@id="mectrl_currentAccount_secondary"]';
    try {
        await page.waitForXPath(xpath);
        elements = await page.$x(xpath);
        let text = await page.evaluate(element => element.textContent, elements[0]);
        if (text.includes(username)) {
            console.log("已经登录，不需要再登录");
            return;
        }
    } catch {}


    try {
        await page.waitForNavigation();
    } catch {}
    
    await delay(3000);
    let url = await page.url();
    if (!url.includes("login.microsoftonline.com")) {
        console.log("已经登录，不需要再登录");
        return;
    }
    
    // 帐号
    await click(page, '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div[1]/div[3]/div/div/div/div[2]/div[2]/div/input[1]');
    await page.keyboard.type(username);

    // 下一步
    await click(page, '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div[1]/div[3]/div/div/div/div[4]/div/div/div/div[2]/input');

    // 密码
    await click(page, '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div/div[2]/input');
    await page.keyboard.type(password);

    // 下一步
    await click(page, '/html/body/div/form[1]/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[4]/div[2]/div/div/div/div/input');

    // 不再显示此消息
    await click(page, '/html/body/div/form/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div[1]/div/label/input');
    
    // 是
    await click(page, '/html/body/div/form/div/div/div[2]/div[1]/div/div/div/div/div/div[3]/div/div[2]/div/div[3]/div[2]/div/div/div[2]/input');

}

async function click(page, xpath) {
    await page.waitForXPath(xpath); 
    elements = await page.$x(xpath);
    await elements[0].click();
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
    console.log(`等待：${time}ms`);
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}
