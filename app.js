const express = require('express')
const app = express()
const path = require('path')
const uploader = require('express-fileupload');
const {
    promises: {
        writeFile,
        appendFile,
    },
    existsSync,
} = require('fs');
const {
    extname,
    resolve
} = require('path');
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(uploader());
app.post('/checkFile', (req, res) => {
    const {
        name,
        hash
    } = req.body;
    const ext = extname(name)
    const fileName = resolve(__dirname, `./public/${hash}${ext}`)
    console.log(fileName, existsSync(fileName));
    if (existsSync(fileName)) {
        return res.send({
            data: true,
            message: '文件已上传'
        })
    } else {
        return res.send({
            data: false,
            message: '文件未上传'
        })
    }
})
app.post('/api/upload', async (req, res) => {
    const {
        name,
        size,
        type,
        offset,
        hash
    } = req.body;
    const {
        file
    } = req.files;
    const ext = extname(name)
    const fileName = resolve(__dirname, `./public/${hash}${ext}`)
    // 不是第一个分片则找到文件追加内容
    if (offset > 0) {
        if (!existsSync(fileName)) {
            res.status(400).send({
                message: '文件不存在'
            })
            return
        }
        await appendFile(fileName, file.data)
        res.send({
            data: 'appended'
        })
        return
    }
    await writeFile(fileName, file.data);
    res.send({
        data: 'created',
    });
})
app.listen(3000, () => {
    console.log("success:3000");
})