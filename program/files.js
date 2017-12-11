var FileDialogInput = null; //Un <input type="file"> que ejecutará el FileDialog

function FileDialog(accept, multiple) {
	//Un objeto para abrir un diálogo de carga de archivo

	if(!FileDialogInput) {
		//Si el <input> aún no existe, se debe crear y añadir
		//al DOM antes de ejecutar su evento.

		FileDialogInput = document.createElement('input');
		FileDialogInput.type = 'file';
		FileDialogInput.style.display = 'none';

		document.body.appendChild(FileDialogInput);
	}
	FileDialogInput.accept = accept ? accept.toString() : '';
	FileDialogInput.multiple = multiple ? true: false;
	
	//Lanzar el evento del <input> y abrir el diálogo
	FileDialogInput.click();

	var self = this; ///alias del objeto actual
	this.action = null; //Callback que se ejecutará al añadir los archivos
	FileDialogInput.onchange = function() {
		if(self.action instanceof Function)
			self.action(this.files);
	};
}
FileDialog.prototype.response = function(callback) {
	//Método que permite definir el callback de respuesta
	if(callback instanceof Function) {
		this.action = callback;
	}
}

function readFileAsURL(file, callback) {
	//Lector de archivos asíncrono
	
	if(!(callback instanceof Function) || !(file instanceof File))
		return;

	var reader = new FileReader();
	reader.onload = function() {
		callback(this);
	}
	reader.readAsDataURL(file);
}
function saveFileBase64(base64, filename) {     
	var trigger = document.createElement('a');

    trigger.href = base64;
    trigger.target = '_blank';
    trigger.download = filename;

    var Event = new MouseEvent('click', {
        'view': window,
        'bubbles': false,
        'cancelable': true
    });

    trigger.dispatchEvent(Event);
}