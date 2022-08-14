const uploader = document.getElementById('uploader')
const progress = document.getElementById('progress')
const output = document.getElementById('output')

function read(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function () {
            resolve(reader.result)
        }
        reader.onerror = reject
        reader.readAsBinaryString(file)
    })
}
uploader.addEventListener('change', async (e) => {
    const [file] = e.target.files
    if (!file) return
    uploader.value = null; //再次点击清空文本
    const content = await read(file)
    const hash = CryptoJS.MD5(content); //根据文件内容生成hash值，在后端作为文件存储的唯一标识(断点续传)
    console.log(CryptoJS.MD5(123456));
    const {
        name,
        size,
        type
    } = file
    progress.max = size
    const chunkSize = 64 * 1024 //分片大小为64k
    let uploaded = 0; //初始化上传进度
    const local = localStorage.getItem(hash) //上传中断或失败，会将文件的上传进度存储在本地
    // 判断是否有中断
    if (local) {
        uploaded = Number(local)
    }
    const isUpload = await checkFile(hash, name)
    console.log(isUpload);
    // 如果上传过的文件被删除，重置上传进度
    if (!isUpload && uploaded == size) {
        localStorage.setItem(hash, 0)
        uploaded = 0
    }
    while (uploaded < size) {
        const chunk = file.slice(uploaded, uploaded + chunkSize, type); //file对象的slice方法，返回一个Blob对象
        const formData = new FormData()
        formData.append('file', chunk)
        formData.append('name', name)
        formData.append('hash', hash)
        formData.append('size', size)
        formData.append('type', type)
        formData.append('offset', uploaded)
        try {
            await axios.post('/api/upload', formData) //分片上传
        } catch (e) {
            if (e) {
                output.innerText = '上传失败。' + e.message;
                return
            }
        }
        uploaded += chunk.size;
        localStorage.setItem(hash, uploaded); //本地保存上传进度
        progress.value = uploaded
    }
    output.innerText = '上传成功。';
})
async function checkFile(hash, name) {
    const formData = new FormData()
    formData.append('hash', hash)
    formData.append('name', name)
    const {
        data: {
            data: isUpload
        }
    } = await axios.post('/checkFile', formData)
    return isUpload
}