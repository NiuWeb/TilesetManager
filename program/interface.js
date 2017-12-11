//Mantener en ámbito global las dos funciones principales
//para poder acceder a ellas desde el DOM.
var add_tileset_dialog;
var add_image_dialog;
var change_size_dialog;

var export_tileset_dialog;
var export_zip_dialog;


window.addEventListener('load', function() {

    
    //Obtener el Workspace
    const Workspace = document.getElementById('workspace');
    const EmptyWorkspace = document.getElementById('empty-workspace-alert');

    //Elementos varios
    const subimg_numb = document.getElementById('subimg-numb');
    const subimg_size = document.getElementById('subimg-size');


    add_tileset_dialog = function() {
    //Abrir un diálogo que permita cargar UNA SOLA imagen
    //como tileset y dividirla
        var dialog = new FileDialog('.png, .jpeg');
        dialog.response(function(file) {
            
            if(!file || !file.length) //Evitar la ejecución si no se ha cargado ningún archivo
                return;

            file = file[0];
            if(!validate_filename(file.name)) {
            //Comprobar si el nombre es válido
                alert('El archivo "' + file.name + '" no es válido');
                return;
            }

            readFileAsURL(file, function(reader) {
            //Leer el contenido de la imagen leída
                var image = new Image();
                    image.src = reader.result;

                image.addEventListener('error', function() {
                //En caso de error
                    this.error = true; //Guardar si se ha producido algún error
                });
                image.addEventListener('load', function() {
                //Al cargar completamente
                    if(this.error) //Si ha habido algún error, detener ejecución
                        return;

                    var self = this; //Alias del objeto actual

                    openSplitImageDialog(this, function(data) {
                    

                        var results = image_split(self, data); //Obtener división de la imagen
                        var images = [];
                        var loaded = 0;

                        results.forEach(function(dataurl) {
                        //Recorrer divisiones y añadirlas al Workspace
                            var image = add_image(dataurl);
                            images.push(image);
                            image.image.addEventListener('load', function() {
                                loaded++;
                                if(loaded == results.length) {
                                    doAfterSplit();
                                }
                            });
                        });

                        function doAfterSplit() {
                            AppendImages(images);
                        }

                    }, is_first);

                });

            });
        });
    }

    add_image_dialog = function() {
    //Abrir un cuadro de diálogo para cargar VARIAS imágenes individuales al Workspace
        var dialog = new FileDialog('.png, .jpg', true);
        var Files = [];
        var loaded = 0;

        dialog.response(function(files) {
        //Leer todos los archivos que se han cargado

            files.forEach(function(file) {
            //Recorrer todos los archivos cargados
                if(!validate_filename(file.name)) {
                //Comprobar si el nombre es válido
                    alert('El archivo "' + file.name + '" no es válido');
                    return;
                }

                readFileAsURL(file, function(reader) {
                
                //Leer el contenido y añadirlo al workspace (y a la lista de imágenes)
                    var image = add_image(reader.result);

                    Files.push(image);
                    image.image.addEventListener('load', function() {

                        loaded++;
                        if(loaded == files.length) {
                            AppendImages(Files);
                        }

                    });

                });
            });
        });
    }

    export_tileset_dialog = function() {
    //Exportar todas las imágenes como un solo tileset
        openExportTilesetDialog(IMAGES, cur_size.w, cur_size.h);

    }
    export_zip_dialog = function() {
    //Exportat todas las imágenes individualmente en un .zip
    //Usando la librería JSZip.JS.
        var zip = new JSZip();
        IMAGES.forEach(function(image, i) {
            var b64 = image.toDataURL('image/png').replace(/^data:image\/png;base64,/i, '');
            zip.file('image' + i + '.png', b64, {base64: true});
        });
        zip.generateAsync({type: 'base64'}).then(function(content) {
            saveFileBase64('data:application/zip;base64,' + content, 'images.zip');
        });
    }

    change_size_dialog = function() {
    //Abrir el diálogo para modificar el tamaño de las imágenes
        if(IMAGES.length)
            openChangeSizeDialog(function(action, option) {
                
                var size = action.splice(0, 1, 2)[0];
                cur_size.w = size[0];
                cur_size.h = size[1];

                console.log(action);

                adjust_all_images([], action, option, false, null, true);
                subimg_size.innerText = cur_size.w.toString() + 'x' + cur_size.h.toString();

            });
    }



    function AppendImages(image_array) {
    //Añadir una lista de canvas.image al DOM y la lista

        var bad_size = false;
        var images = [];
        var cur_len = IMAGES.length;

        image_array.forEach(function(image) {

            //Buscar el tamaño mayor y menor
            if(image.width < min_size.w)
                min_size.w = image.width;
            if(image.height < min_size.h)
                min_size.h = image.height;

            if(image.width > max_size.w)
                max_size.w = image.width;
            if(image.height > max_size.h)
                max_size.h = image.height;

            //Añadir las imágenes, revisar si los tamaños coinciden o no
            if(/*!is_first*/true) {

                if(cur_size.w && cur_size.h)
                if(image.width !== cur_size.w || image.height !== cur_size.h)
                    bad_size = true;
            }
            if(!bad_size) {
                cur_size.w = image.width;
                cur_size.h = image.height;
            }   
            images.push(image);
        });

        //Si los tamaños no coinciden, abrir el diálogo correspondiente
        //para ajustarlos.
        if(bad_size) {
            openChooseSizeDialog(function(action, option, is_first) {

                adjust_all_images( images, action, option, is_first,
                    function() {
                        add_all();
                        subimg_numb.innerText = IMAGES.length.toString();
                        subimg_size.innerText = cur_size.w.toString() + 'x' + cur_size.h.toString();
                    });


            }, is_first);
        }
        //Si los tamaños coinciden, añadir directamente las imágenes
        else {
            add_all();
            subimg_numb.innerText = IMAGES.length.toString();
            subimg_size.innerText = cur_size.w.toString() + 'x' + cur_size.h.toString();
        }

        is_first = false;

        function add_all() {
            images.forEach(function(image, i) {
                IMAGES.push(image);
                image.count = cur_len + i+1;
                image.title = 'Subimagen ' + (cur_len + i+1);
                Workspace.appendChild(image.box);
                toggleWorkspace(true);
            });
        }

    }



    function toggleWorkspace(active) {
    //Mostrar u ocultar el Workspace y el mensaje de "Workspace vacío"

        if(typeof(active) === 'undefined') {
            if(Workspace.style.display == '') {
                Workspace.style.display = 'none';
                EmptyWorkspace.style.display = '';
            }
            else if(Workspace.style.display == 'none') {
                Workspace.style.display = '';
                EmptyWorkspace.style.display = 'none';
            }
        }
        else {          
            if(!active) {
                Workspace.style.display = 'none';
                EmptyWorkspace.style.display = '';
            }
            else {
                Workspace.style.display = '';
                EmptyWorkspace.style.display = 'none';
            }
        }

    }

    function adjust_all_images(images, action, option, is_first, callback, need_resize) {
    //Adaptar todas las imágenes al mismo tamaño
        if(!(callback instanceof Function))
            callback = function(){};

        if(is_first)
            action[0] = Math.min( action[0], option.size.last - 1);

        switch(action[0]) {
            case option.size.last:
            //Si se ha escogido la opción de "mantener tamaño actual".
            //Igualar todos al tamaño actual.
            break;

            case option.size.min:
                //Si se escoje dejar el menor de los tamaños
                if(IMAGES.length)
                    need_resize = true;
                cur_size.w = min_size.w;
                cur_size.h = min_size.h;
            break;

            case option.size.max:
                //Si se escoje el mayor de los tamaños
                if(IMAGES.length)
                    need_resize = true;
                cur_size.w = max_size.w;
                cur_size.h = max_size.h;
            break;
        }

        //Igualar tamaños
        max_size.w = cur_size.w;
        max_size.h = cur_size.h;
        min_size.w = cur_size.w;
        min_size.h = cur_size.h;

        switch(action[1]) {
        //Actuar según el tipo de escala.

            case option.scale.stretch:
            //Modo "estirar imagen"
                if(need_resize) {
                    //Si ya hay imágenes añadidas, estirarlas.
                    modify_image_list(IMAGES, function(image) {             
                        return image_resize(
                            image, 
                            0, 
                            0,
                            image.width,
                            image.height,
                            0,
                            0,
                            cur_size.w,
                            cur_size.h
                        );
                    });
                }

                //Modificar todas las imágenes nuevas estirándolas
                modify_image_list(images, function(image) {

                    return image_resize(
                        image, 
                        0, 
                        0,
                        image.width,
                        image.height,
                        0,
                        0,
                        cur_size.w,
                        cur_size.h
                    );

                }, callback);

            break;


            case option.scale.keep:
            //Opción "mantener tamaño individual"
            //Esta opción toma en cuenta la alineación escogida.

                function get_position(image) {
                //Función para obtener la posición de una imagen
                //dependiendo de la alineación escogida.
                    var pos = {x: 0, y: 0};
                    switch(action[2][0]) {
                        case option.halign.left:
                        //Alineación horizontal a la izquierda
                        //No se debe hacer nada :v.
                        break;
                        case option.halign.center:
                        //Alineación horizontal centrada
                            pos.x = Math.round(cur_size.w/2 - image.width/2);
                        break;
                        case option.halign.right:
                        //Alineación horizontal a la izquierda
                            pos.x = cur_size.w - image.width;
                        break;
                    }
                    switch(action[2][1]) {
                        case option.valign.top:
                        //Alineación vertical hacia arriba
                        //No hacer nada :v
                        break;
                        case option.valign.middle:
                        //Alineación vertical centrada
                            pos.y = Math.round(cur_size.h/2 - image.height/2);
                        break;
                        case option.valign.bottom:
                        //Alineación vertical hacia abajo
                            pos.y = cur_size.h - image.height;
                        break;
                    }
                    return pos;
                }

                if(need_resize) {
                //Si las imágenes ya existentes necesitan ser modificadas
                    modify_image_list(IMAGES, function(image) {
                    //Pues hacerlo :v
                        var pos = get_position(image); //obtener posición según alineación
                        return image_resize(
                            image, 
                            0, 
                            0,
                            image.width,
                            image.height,
                            pos.x,
                            pos.y,
                            image.width,
                            image.height,
                            cur_size.w,
                            cur_size.h
                        );

                    });
                }

                modify_image_list(images, function(image) {
                //Modificar el tamaño de las imágenes nuevas
                    var pos = get_position(image); //Obtener posición según alineación
                    return image_resize(
                        image, 
                        0, 
                        0,
                        image.width,
                        image.height,
                        pos.x,
                        pos.y,
                        image.width,
                        image.height,
                        cur_size.w,
                        cur_size.h
                    );
                }, callback);
            break;
        }

    }

    function openChooseSizeDialog(callback, is_first) {
    //Función para abrir el cuadro de diálogo de selección de
    //tamaño y leer la respuesta del usuario para enviarla al
    //callback establecido.

        const dialog = document.getElementById('choose-size');
            dialog.style.display = '';

        const isnofirst  = document.choose_option.getElementsByClassName('is-no-first')[0];
        const justifkeep = document.choose_option.getElementsByClassName('just-if-keep')[0];

        var options = {};

        //Obtener todos los <input type="radio"> y recorrerlos
        var inputs = document.querySelectorAll('input[type="radio"]');
        inputs.forEach(function(input) {
        //Añadir el evento change a cada input para
        //actualizar las opciones
            if(input.checked)
                options[input.name] = input.value;
            input.addEventListener('change', function() {
                if(!this.checked)
                    return;

                options[this.name] = this.value;
                doAfterCheck();
            });

        });


        function doAfterCheck() {
        //La revisión que se hará después de cada cambio en las opciones
            if(!is_first) {
                isnofirst.style.display = '';
            }
            else
                isnofirst.style.display = 'none';

            if(options['action2'] == 1)
                justifkeep.style.display = '';
            else
                justifkeep.style.display = 'none';
        }
        doAfterCheck();

        var buttons = document.choose_option.getElementsByTagName('button'); //Todos los botones
        buttons.forEach(function(button, i) {
            if(i > 8) //Actuar sólo con los 9 primeros botones (los de la alineación)
                return;

            button.onclick = function(ev) {
            //Al clickear un botón, añadirle el atributo checked y eliminarlo
            //de los demás botones
                ev.preventDefault();
                buttons.forEach(function(button, i) {
                    if(i > 8)
                        return;
                    button.removeAttribute('checked');
                });
                this.setAttribute('checked', true);

            }
        });
        buttons[9].onclick = function(ev) {
        //Al hacer clic en el botón de Aceptar.
            dialog.style.display = 'none'; //Ocultar diálogo
            ev.preventDefault(); //Evitar evento por defecto

            var align = document.choose_option.querySelector('button[checked]').value.toInteger(); //Obtener el valor de la alineación
            var result = [

                options['action'].toInteger(), //Acción 1: Tamaño a escoger (mayor, menor, actual)
                options['action2'].toInteger(), //Acción 2: Escala a escoger (estirar, mantener)
                [align%3, Math.floor(align/3)] //Alineación: Horizontal (0, 1, 2) y vertical (0, 1, 2)

            ];
            callback(result, {
                //Las opciones. Un simple alias para hacerlas legibles
                size: {max: 0, min: 1, last: 2},
                scale: { stretch: 0, keep: 1 },
                halign: {
                    left: 0,
                    center: 1, 
                    right: 2
                },
                valign: {
                    top: 0,
                    middle: 1,
                    bottom: 2
                }
            }, is_first);
        }
    }


    function openSplitImageDialog(image, callback, is_first) {
    //Abre el cuadro de diálogo para dividir un tileset.
    //image: recurso <img> a dividir
    //callback: función que se ejecutará al recibir respuesta


        //Obtener todos los elementos necesarios
        const view_tileset = document.getElementById('view-tileset');
        const view_render = view_tileset.getContext('2d');

        //El tamaño del canvas = el tamaño del tileset
        view_tileset.width = image.width;
        view_tileset.height = image.height;

        //Hacer visible el cuadro de diálogo
        const dialogbox = document.getElementById('split-tileset');
            dialogbox.style.display = '';

        //Obtener inputs y en su evento input (cambiar contenido) actualizar
        //la rejilla del tileset.
        const inputs = dialogbox.getElementsByTagName('input');
            inputs.forEach(function(input) {
                input.oninput = drawGrid;
            });


        //Obtener botones
        const buttons = dialogbox.getElementsByTagName('button');
            buttons[0].onclick = function() {
                //El primer botón sólo cierra el cuadro de diálogo
                view_render.clearRect(0, 0, image.width, image.height);
                dialogbox.style.display = 'none';
            }
            buttons[1].onclick = function() {
                //El segundo botón cierra el cuadro de diálogo y llama el callback,
                //con las opciones escogidas por el usuario
                dialogbox.style.display = 'none';
                callback( {

                    number: inputs[0].value.toInteger(),
                    by_row: inputs[1].value.toInteger(),
                    width: inputs[2].value.toInteger(),
                    height: inputs[3].value.toInteger(),
                    separation: {
                        x: inputs[4].value.toInteger(),
                        y: inputs[5].value.toInteger()
                    },
                    origin: {
                        x: inputs[6].value.toInteger(),
                        y: inputs[7].value.toInteger()
                    }

                } );

            };


        function drawGrid() {         
        //Dibujar la cuadrícula encima de la imagen del tileset  
            view_render.clearRect(0, 0, image.width, image.height);
            view_render.drawImage( image, 0, 0 );

            var tiles_num = inputs[0].value.toInteger();
            var tiles_by_row = inputs[1].value.toInteger();

            var tile_w = inputs[2].value.toInteger();
            var tile_h = inputs[3].value.toInteger();

            var tile_sepw = inputs[4].value.toInteger();
            var tile_seph = inputs[5].value.toInteger();

            var tile_originx = inputs[6].value.toInteger();
            var tile_originy = inputs[7].value.toInteger();

            var grid_col = inputs[8].value.match(/^#(([0-9a-f]{2}){3})$/i);
            if(!grid_col)
                grid_col = '#000000';
            else grid_col = grid_col[0];

            view_render.strokeStyle = grid_col;

            for(let i = 0; i < tiles_num; i++) {
                var pos_x = i % tiles_by_row;
                var pos_y = Math.floor(i / tiles_by_row);

                view_render.strokeRect(
                    tile_originx + pos_x*tile_w + tile_sepw * pos_x,
                    tile_originy + pos_y*tile_h + tile_seph * pos_y,
                    tile_w,
                    tile_h
                );
            }
        }
        drawGrid();
    }


    function openExportTilesetDialog(imagelist, width, height) {
    //Cuadro de diálogo para exportar tileset.
    //Toma una lista de imágenes y las convierte en una sola (tileset)
        if(!(imagelist instanceof Array))
            return;

        //Cargar elementos necesarios
        const view_tileset = document.getElementById('view-tileset');
        const view_render = view_tileset.getContext('2d');

        const dialogbox = document.getElementById('split-tileset');
            dialogbox.style.display = '';

        //Redibujar tileset al cambiar valores
        const inputs = dialogbox.getElementsByTagName('input');
            inputs.forEach(function(input) {
                input.oninput = drawGrid;
            });

        //Cambiar el texto del diálogo
        dialogbox.getElementsByTagName('tr')[12].style.display = 'none';
        dialogbox.getElementsByTagName('h2')[0].innerText = 'Exportar tileset';

        //Tamaño de imágenes y número de imágenes
        //serán read-only.
        inputs[0].readOnly = true;
        inputs[0].value = imagelist.length;

        inputs[2].readOnly = true;
        inputs[2].value = width;

        inputs[3].readOnly = true;
        inputs[3].value = width;

        const buttons = dialogbox.getElementsByTagName('button');
            buttons[0].onclick = function() {
                //Volver inputs y textos a su estado original, para cerrar el diálogo.
                inputs[0].readOnly = false;
                inputs[2].readOnly = false;
                inputs[3].readOnly = false;

                dialogbox.style.display = 'none';
                dialogbox.getElementsByTagName('tr')[12].style.display = '';
                dialogbox.getElementsByTagName('h2')[0].innerText = 'Importar tileset';
            }
            buttons[1].onclick = function() {
                //Volver inputs y textos a su estado original, cerrar el diálogo
                //y guardar archivo
                inputs[0].readOnly = false;
                inputs[2].readOnly = false;
                inputs[3].readOnly = false;

                dialogbox.style.display = 'none';
                dialogbox.getElementsByTagName('tr')[12].style.display = '';
                dialogbox.getElementsByTagName('h2')[0].innerText = 'Importar tileset';

                saveFileBase64(view_tileset.toDataURL('image/png'), 'tileset.png');
            }


        function drawGrid() {
        //Dibujar tileset resultante.
            view_render.clearRect(0, 0, width, height);

            var tiles_by_row = inputs[1].value.toInteger();

            var tile_sepw = inputs[4].value.toInteger();
            var tile_seph = inputs[5].value.toInteger();

            var tile_originx = inputs[6].value.toInteger();
            var tile_originy = inputs[7].value.toInteger();


            view_tileset.width = tile_originx + (width + tile_sepw) * tiles_by_row - tile_sepw;
            view_tileset.height = tile_originy + (height + tile_seph) * Math.ceil(imagelist.length / tiles_by_row) - tile_seph; 

            imagelist.forEach(function(image, i) {

                var pos_x = i % tiles_by_row;
                var pos_y = Math.floor(i / tiles_by_row);

                view_render.drawImage(
                    image.image, 
                    tile_originx + pos_x * (width + tile_sepw),
                    tile_originy + pos_y * (height + tile_seph)
                );

            });
        }
        drawGrid();
    }

    function openChangeSizeDialog(callback) {
    //Cuadro de diálogo para cambiar el tamaño de las imágenes
        const dialogbox = document.getElementById('change-size');
        const inputs = dialogbox.querySelectorAll('input[type="number"]');
        const select = dialogbox.querySelectorAll('input[type="radio"]');
        const button = dialogbox.getElementsByTagName('button');
        const if_keep = dialogbox.getElementsByClassName('just-if-keep')[0];

            dialogbox.style.display = ''; //Mostrar diálogo

            //EL valor por defecto de los inputs es el tamaño actual
            inputs[0].value = cur_size.w;
            inputs[1].value = cur_size.h;

        var action = 0;

        function onChange() {
        //Ocultar o mostrar cuadro de alineación dependiendo de la opción
            if(select[1].checked)
                if_keep.style.display = '';
            else
                if_keep.style.display = 'none';
        }
        onChange();


        //Cambiar la acción dependiendo de la opción que se escoja.
        select.forEach(function(e) {
            e.onchange = function() {
                onChange();
                if(this.checked)
                    action = this.value.toInteger();
            };
            e.onchange();
        });

        button.forEach(function(b, i) {
        //Selección de alineación.
            if(i > 8)
                return;

            b.onclick = function(e) {
                e.preventDefault();
                button.forEach( function(b, i) {
                    if(i > 8)
                        return;
                    b.removeAttribute('checked');
                });
                this.setAttribute('checked', 'true');
            }
        });

        button[9].onclick = function(e) {
            e.preventDefault();

            dialogbox.style.display = 'none';
            var align = dialogbox.querySelector('button[checked]').value.toInteger();
            var result = [

                [
                    inputs[0].value.toInteger(),
                    inputs[1].value.toInteger()
                ],
                action,
                [
                    align%3,
                    Math.floor(align/3)
                ]

            ];

            callback(result, {
                size: {max: 0, min: 1, last: 2},
                scale: { stretch: 0, keep: 1 },
                halign: {
                    left: 0,
                    center: 1, 
                    right: 2
                },
                valign: {
                    top: 0,
                    middle: 1,
                    bottom: 2
                }
            });
        };


    }




    //Control para eliminar todas las subimágenes seleccionadas
    window.addEventListener('keydown', function(ev) {
        var key = ev.which || ev.keyCode;
        if(key === vk.supr) {

            if(SELECTED.length) {

                if(!confirm('¿Realmente desea eliminar las ' + SELECTED.length.toString() + ' subimágenes seleccionadas?'))
                    return;

                SELECTED.forEach( function(div) {
                    Workspace.removeChild(div);
                    var index = IMAGES.indexOf(div.img);

                    if(index > -1)
                        IMAGES.splice( index , 1);
                    else
                        console.warn('Desincronización Workspace-Almacenamiento');
                });
                SELECTED.clear();

            }


            if(!IMAGES.length) {
                is_first = true;

                cur_size.w = 0;
                cur_size.h = 0;

                max_size.w = -Infinity;
                max_size.h = -Infinity;

                min_size.w = Infinity;
                min_size.h = Infinity;
            }


            subimg_numb.innerText = IMAGES.length.toString();
            document.getElementById('subimg-select').innerText = 'Seleccionadas: ' + SELECTED.length.toString();
        }
    });

});