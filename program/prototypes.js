if (!Array.prototype.forEach) {
    //Si los arreglos no tienen el foreach en el prototipo,
    //crearlo manualmente.

    Array.prototype.forEach = function(callback) {
        if (!(callback instanceof Function))
            return;

        for (var i = 0; i < this.length; i++) {
            //callback(value, index, array);
            callback(this[i], i, this);
        }
    };
}
FileList.prototype.forEach = Array.prototype.forEach; //Añadir el método forEach a las FileList
HTMLCollection.prototype.forEach = Array.prototype.forEach; //y también a las HTMLCollections

//Prototipo para limpiar un arreglo
Array.prototype.clear = function() {
    this.splice(0, this.length);
}



//Prototipos para la conversión rápida de cadenas de texto a números
String.prototype.toNumber = function() {
    var str = this.replace(/[^0-9.\-+e]/g, '');
    var numb = window.parseFloat(str);
    return numb ? numb : 0;
}
String.prototype.toInteger = function() {
    var str = this.replace(/[^0-9.\-+e]/g, '');
    var numb = Math.floor(window.parseFloat(str));
    return numb ? numb : 0;
}


//Validación de archivos
function file_ext(fname) {
    var ext = fname.match(/^.*(\.\w+)$/i);
    if (!ext || !ext.length || ext.length < 2)
        return false;
    return ext[1];
}

function validate_filename(fname) {
    return ['.png', '.jpg'].indexOf(file_ext(fname)) !== -1;
}



//Control de teclado
var keyboard = {};
const vk = {
    shift: 16,
    control: 17,
    space: 32,
    enter: 13,
    supr: 46,
    backspace: 8
};
window.addEventListener('keydown', function(ev) {
    var key = ev.which || ev.keyCode;
    keyboard[key] = true;
});
window.addEventListener('keyup', function(ev) {
    var key = ev.which || ev.keyCode;
    keyboard[key] = false;
});

function keyboard_check(key) {
    return keyboard[key] === true;
}