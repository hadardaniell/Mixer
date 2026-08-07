const url = "https://vm.tiktok.com/ZMkYm7YgJ/";
const jinaUrl = `https://r.jina.ai/${url}`;

async function test() {
  console.log(`Fetching from Jina: ${jinaUrl}`);
  try {
    const res = await fetch(jinaUrl);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Length:", text.length);
    console.log("Preview:", text.substring(0, 300));
    
    // Check if it resolved the redirect or just gave us the TikTok captcha
    if (text.includes("Verify to continue") || text.includes("tiktok-captcha")) {
      console.log("BLOCKED BY TIKTOK CAPTCHA");
    } else {
      console.log("SEEMS OK?");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
