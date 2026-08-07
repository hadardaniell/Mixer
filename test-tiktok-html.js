async function test() {
  try {
    const res = await fetch('https://www.tiktok.com/@/video/7440957825192480046');
    const text = await res.text();
    const match = text.match(/"uniqueId":"([^"]+)"/);
    console.log("Unique ID match:", match ? match[1] : null);
    
    // Also try checking if there's any JSON we can extract
    const titleMatch = text.match(/<title>([^<]+)<\/title>/);
    console.log("Title:", titleMatch ? titleMatch[1] : null);
  } catch (e) {
    console.error(e);
  }
}
test();
