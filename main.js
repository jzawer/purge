const electron = require('electron');
const fs = require('fs');
const path = require('path');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({width: 800, height: 600});

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('select-directory-recursive', (e, args) => {
	walk(args[0], (err, result) => {
		if (err)
			throw err;
		e.sender.send('list-directory', result);
	});
});

ipcMain.on('select-directory', (e, args) => {
	var dir = args[0];
	var files = [];
	fs.readdir(dir, (err, list) => {
		list.forEach((el) => {
			if (fs.statSync(dir + '/' + el).isFile())
				files.push(dir + '/' + el);
		});

		e.sender.send('list-directory', files);
	});
});

var walk = (dir, done) => {
	var results = [];
	fs.readdir(dir, (err, list) => {
		if (err)
			return done(err);

		var pending = list.length;

		if (!pending)
			return done(null, results);

		list.forEach((file) => {
			file = path.resolve(dir, file);
			fs.stat(file, (err, stat) => {
				if (stat && stat.isDirectory()) {
					walk(file, (err, res) => {
						results = results.concat(res);

						if (!--pending)
							done(null, results);
					});
				} else {
					results.push(file);

					if (!--pending)
						done(null, results);
				}
			});
		});
	});
};

ipcMain.on('delete-files', (e, args) => {
	var list_of_files = args;
	var file_path;
	var last = {};
	var next = {};
	list_of_files.forEach((file, i) => {
		file_path = path.parse(file);

		if (list_of_files[i+1])
			next = path.parse(list_of_files[i+1]);
		else
			next = {};

		if (path.format(last) !== file_path) {

			if (!fs.existsSync(file_path.dir + '/backup'))
				fs.mkdirSync(file_path.dir + '/backup');

			if (next.name === file_path.name)
				fs.renameSync(file, file_path.dir + '/backup/' + file_path.name + file_path.ext);
		}

		e.sender.send('delete', file_path.name);
		last = file_path;
	});
});
