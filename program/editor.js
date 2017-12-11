var IMAGES = []; //Listado de todas las subimágenes del Workspace
var SELECTED = [];

//Un canvas para editar las imágenes
var editCanvas = document.createElement('canvas');
var editRender = editCanvas.getContext('2d'); 


//Tamaño máximo y mínimo de las imágenes cargadas
var is_first = true;
var cur_size = {w: 0, h: 0}; //Tamaño actual de las subimágenes (sólo si !is_first)
var max_size = {w: -Infinity, h: -Infinity};
var min_size = {w: Infinity, h: Infinity};


function add_image(dataurl) {
	//Crea una imagen a partir del dataURL dado y la adjunta al workspace
	var box = document.createElement('div');
		box.setAttribute('class', 'subimage-box');


	var img = document.createElement('canvas');
		img.box = box;
		img.image = new Image();
		img.image.src = dataurl;
		img.image.canvas = img;

		img.image.error = false;
		img.image.onerror = function() {
			this.error = true;
			this.src = "";
		};
		img.image.onload = function() {
			if(this.error)
				return;

			img.width = this.width;
			img.height = this.height;
			img.getContext('2d').drawImage(this, 0, 0);
		}
		img.setAttribute('class', 'subimage');

		box.onclick = function() {

			if(keyboard_check(vk.control)) {

				var pos = SELECTED.indexOf(this);
				if(pos > -1) {
					SELECTED.splice(pos, 1);
					this.setAttribute('class', 'subimage-box');
				}
				else {
					SELECTED.push(this);
					this.setAttribute('class', 'subimage-box selected');
				}

			}
			else {
				SELECTED.forEach(function(img) {
					img.setAttribute('class', 'subimage-box');
				});
				SELECTED.clear();
			}

			document.getElementById('subimg-select').innerText = 'Seleccionadas: ' + SELECTED.length.toString();
		}


	box.img = img;
	box.appendChild(img);

	return img;
}
function image_resize(image, x, y, w, h, xx, yy, ww, hh, www, hhh) {
	//Recorta una imagen usando el canvas, y devuelve
	//su dataURL.

	//image: <img> a modificar
	//x, y: Posición relativa a la imagen desde la cual dibujarla
	//w, h: El tamaño relativo a la imagen a tomar
	//xx, yy: Posición en el canvas en donde dibujar la imagen
	//ww, hh: Tamaño de la imagen en el canvas
	//www, hhh: Tamaño del lienzo de la imagen (sin deformar su contenido)

	xx = xx ? xx: 0;
	yy = yy ? yy: 0;
	ww = ww ? ww: w;
	hh = hh ? hh: h;

	editCanvas.width = www ? www: ww;
	editCanvas.height = hhh ? hhh: hh;

	editRender.clearRect(0, 0, ww, hh);
	editRender.drawImage(image, x, y, w, h, xx, yy, ww, hh);

	var result = editCanvas.toDataURL('image/png');
	return result;
}

function modify_image_list(imagelist, callback, onload) {
	//Una función que permite modificar las imágenes mediante un
	//callback que devuelve la imagedata nueva.
	var loaded_images = 0;

	imagelist.forEach(function(image) {

		image.image.src = callback(image.image);
		image.image.onload = function() {

			image.width = this.width;
			image.height = this.height;
			image.getContext('2d').clearRect(0, 0, image.width, image.height);
			image.getContext('2d').drawImage(this, 0, 0);

			loaded_images++;
			if(loaded_images == imagelist.length && (onload instanceof Function))
				onload(imagelist);
		}

	});
}


function image_split(image, data) {

	var results = [];
	for(let i = 0; i < data.number; i++) {

		var pos_x = i % data.by_row;
		var pos_y = Math.floor(i / data.by_row);

		var result = image_resize(
			image,
			data.origin.x + pos_x * (data.width + data.separation.x),
			data.origin.y + pos_y * (data.height + data.separation.y),
			data.width,
			data.height
		);
		results.push(result);
	}
	return results;

}