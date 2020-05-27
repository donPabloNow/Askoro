const {app, BrowserWindow} = require('electron')

app.whenReady().then(()=>{


    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true
        }
    })


    window.loadFile('site/index.html')
    window.webContents.openDevTools();
    window.setMenu(null)
})
