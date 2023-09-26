const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fs1 = require('fs');
const YAML = require('yaml');
const { parse } = require('path');

const fileContents = fs1.readFileSync('../wei-build/data/wei/windows/build.dat','utf8');
const submitFile = YAML.parse(fileContents);

const args = process.argv.slice(2);
let jumpArgs = typeof args[0] !== 'undefined' ? args[0] : "0" ;
jumpArgs = parseInt(jumpArgs);

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
    let page = await browser.newPage();
    const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';
    await page.setUserAgent(agent);

    let submitUrl = "https://security.microsoft.com/reportsubmission?viewid=fileSubmissions";

    await page.goto(submitUrl, {timeout: 120*1000})

    
    let i = 0;
    for (const key in submitFile) {
        if (submitFile.hasOwnProperty(key)) {
            const value = submitFile[key];
            let file_path = `../wei-release/wei/windows/latest/${value}.exe`;
            
            if (i++ < jumpArgs || i < jumpArgs + 3) {
                continue;
            }

            console.log(`上报文件: ${file_path}`);
            await filesubmission(page, file_path);
        }
    }

    console.log("文件 id 为 " + i);
    console.log("每天程序上传只允许3个，下一次请输入yarn start " + i);
    await delay(600000);

    await browser.close();
}

index();

async function filesubmission(page, file_path) {
    // 打开提交页面
    await click_text(page, 'Add new submission');

    // 等待页面打开
    await click_text(page, 'Share feedback and relevant content with Microsoft');

    // let file_path = `../wei-release/windows/latest/data/wei-task.exe`;
    let xpath = '//*[@id="fluent-default-layer-host"]/div/div/div/div/div[2]/div[2]/div/div[2]/div/div[2]/div[1]/input'
    await page.waitForXPath(xpath); 
    const inputElementHandles = await page.$x(xpath);
    await inputElementHandles[0].uploadFile(file_path);

    // // Choose the priority
    await click_text(page, 'High - need immediate attention (3 allowed per org per day)');
    
    await delay(1000);
    
    await page.evaluate(() => {
        [...document.querySelectorAll('.ms-Button span')].find(
            element => element.textContent === '提交'
        ).click();
    });

    await page.evaluate(() => {
        [...document.querySelectorAll('.ms-Button span')].find(
            element => element.textContent === '确定'
        ).click();
    });

    xpath = `//*[contains(text(), "Done")]`;
    await page.waitForXPath(xpath, {timeout: 120*1000}); 
    await page.evaluate(() => {
        [...document.querySelectorAll('.ms-Button span')].find(
            element => element.textContent === 'Done'
        ).click();
    });
}

async function click_text(page, text) {
    xpath = `//*[contains(text(), "${text}")]`;
    await click(page, xpath);
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
