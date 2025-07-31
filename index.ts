import NodeRSA from 'node-rsa';
const crypto = require('crypto');
const fs = require('fs')
import { appendFile, writeFile } from "node:fs";
const dbPrivateKey = process.env.DB_PRIVATE
const gameServerPublicKey = process.env.GAME_SERVER_PUBLIC
const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64")
const server = Bun.serve({
    port: 3000,
    fetch(req: Request) {
      const url = new URL(req.url);
      const path = url.pathname;
  
      if (req.method === "GET") {
        return handleGet(req);
      } else if (req.method === "POST" && path === "/log") {
        handleLog(req)
      } else if (req.method === "POST") {
        return handlePost(req);
      }else {
        return new Response("Not Found", { status: 404 });
      }
    },
  } as any);
  function signData(data) {
    let signer = new NodeRSA(dbPrivateKey);
    return signer.sign(crypto.createHash("sha256").update(data).digest("hex"), 'base64', 'utf8');
  }
  function verifySignature(data, signature) {
    let verifier = new NodeRSA(gameServerPublicKey);
    return verifier.verify(crypto.createHash("sha256").update(data).digest("hex"), signature, 'utf8', 'base64');
  }  
  async function handleGet(req:Request) {
    let time = new Date().getTime()
    const params = Object.fromEntries(new URL(req.url).searchParams);
    if (verifySignature(params.time, decodeURIComponent(params.timeSig)) && time - parseInt(params.time) < 3000){
      let fileData;
      if (params.file.endsWith(".log")){
        fileData = await Bun.file(`./log/${params.file}`).text()
      } else {
        fileData = await Bun.file(`./data/${params.file}`).text()
      }
      let encryptedData = encryptData(fileData);
      let returnData = { data: encryptedData.data, signature: signData(encryptedData.data), iv: encryptedData.iv };
      return new Response(JSON.stringify(returnData), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("{\"data\":null}", {
        headers: { "Content-Type": "application/json" },
      });
    }
    
  }
  function encryptData(text){
    let iv = crypto.randomBytes(16)
    let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    return {
      data: cipher.update(text, 'utf8', 'base64') + cipher.final("base64"),
      iv: iv.toString("base64")
    }
  }
  function decryptData(data, iv){
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
    return decipher.update(data, 'base64', 'utf8') + decipher.final("utf8");
  }
  async function handlePost(req: Request) {
    let time = new Date().getTime()
    let body = await req.json();
    let data = body.data;
    let responseData  = {}
    if (verifySignature(JSON.stringify(data), body.signature)){
      responseData.status = 1
    } else {
      responseData.reason = "Invalid signature"
      responseData.status = 0
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!data.data || !data.iv || !data.file){
      responseData.status = 0
      responseData.reason = "Missing parameters"
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (time - parseInt(data.time) >= 3000){
      responseData.status = null
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json" },
      });
    }
    let decryptedData = decryptData(data.data, data.iv)
    if (data.type == "append"){
      appendFile(`./data/${data.file}`, decryptedData, (err) => {
        if (err) throw err;
      });
    } else if (data.type == "log"){
      appendFile(`./log/${data.file}`, decryptedData + "\n", (err) => {
        if (err) throw err;
      });
    } else if (data.type == "write"){
      writeFile(`./data/${data.file}`, decryptedData, (err) => {
        if (err) throw err;
      })
    } else if (data.type == "deleteUser"){
      let usernameToDelete = data.file
      fs.readFile("./data/login.txt", "utf8", (err, data) => {
        if (err) return console.error("Error reading file:", err);

        const lines = data.split("\n");
        const indexToDelete = lines.findIndex((line) =>
                line.startsWith(usernameToDelete + ";"),
        );

        if (indexToDelete !== -1) {
                lines.splice(indexToDelete, 1);
                const updatedContent = lines.join("\n");

                fs.writeFile("./data/login.txt", updatedContent, "utf8", (err) => {
                        if (err) return console.error("Error writing file:", err);
                });
        }
      });
      fs.readFile("./data/saves.csv", "utf8", (err, data) => {
        if (err) return console.error("Error reading file:", err);

        const lines = data.split("\n");
        const indexToDelete = lines.findIndex((line) =>
                line.startsWith(usernameToDelete + ","),
        );

        if (indexToDelete !== -1) {
                lines.splice(indexToDelete, 1);
                const updatedContent = lines.join("\n");

                fs.writeFile("./data/saves.csv", updatedContent, "utf8", (err) => {
                        if (err) return console.error("Error writing file:", err);
                });
        }
      });
      fs.readFile("./data/social-credit-scores.csv", "utf8", (err, data) => {
        if (err) return console.error("Error reading file:", err);

        const lines = data.split("\n");
        const indexToDelete = lines.findIndex((line) =>
                line.startsWith(usernameToDelete + ","),
        );

        if (indexToDelete !== -1) {
          lines.splice(indexToDelete, 1);
          const updatedContent = lines.join("\n");
          fs.writeFile("./data/social-credit-scores.csv", updatedContent, "utf8", (err) => {
            if (err) return console.error("Error writing file:", err);
          });
        }
      });

    }
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  }
async function handleLog(req:Request){
    return new Response()
}
console.log(`Server running at http://localhost:${server.port}`);