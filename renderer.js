const $ = require('jquery');
const {dialog} = require('electron').remote;
const {ipcRenderer} = require('electron');
var list_of_files = [];

$('#select-directroy').on('click', () => {
	list_of_files = [];
	$('#list').children().remove();

	dialog.showOpenDialog({properties: ['openDirectory']}, (result) => {
		if (!result)
			return false;

		if (document.getElementById('recursive').checked)
			ipcRenderer.send('select-directory-recursive', result);
		else
			ipcRenderer.send('select-directory', result);
	});
});

ipcRenderer.on('list-directory', (e, args) => {
	$.each(args, (index, file) => {
		list_of_files.push(file);
		$('#list').append('<p>' + file + '</p>');
	});
});

$('#init-purge').on('click', () => {
	ipcRenderer.send('delete-files', list_of_files);
});

ipcRenderer.on('delete', (e, args) => {
	$('#deleted-files').append('<p>' + args + '</p>');
});
