/** 
  * 
  * Sesc Guideline - v2.1.0
  * Build: 2013-04-12 11:15:20
  * ------------------------- 
  * Repository: https://github.com/dclick/sesc-guideline 
  * Issues: https://github.com/dclick/sesc-guideline/issues
  * Copyright (c) 2013 - DClick contato@dclick.com.br; 
  * 
 **/

(function($) {
  "use strict"
  if($.fn.livequery) {
    $('[data-spy="affix"]').livequery(function() {
      var $spy = $(this), data = $spy.data();

      data.offset = data.offset || {};

      data.offsetBottom && (data.offset.bottom = data.offsetBottom);
      data.offsetTop && (data.offset.top = data.offsetTop);

      $spy.affix(data);
    });
  }
}(jQuery));
(function($) {
  if($.fn.livequery) {
    $('[data-tooltip]').livequery(function() {
      $(this).tooltip();
    });
  }
}(jQuery));
/**
 * Arquivo de configuração para os componentes do jQuery UI.
 * @author william.lepinski
 */
(function($) {
    if ($.fn.livequery) {
        $('[chosen]').livequery(function(event) {
            var $target = $(this);
            if ($target.is('select')) {
                $target.chosen({
                    no_results_text: $target.data('chosen-no-results-text')
                });
            }
        });
    }
}(jQuery));

/**
 * Este arquivo efetua a configuração do componente jquery-datatables
 * adoquando-o ao twitter-bootstrap e traduzindo-o para pt-br.
 *
 * @author william.lepinski
 */
(function() {

    /**
     * Extendendo as configurações de tradução do componente para pt-BR.
     */
    $.extend(true, $.fn.dataTable.defaults, {
        'sDom': "<'table-header clearfix'<'length'l><'filter'f>r>t<'table-footer clearfix'<'info'i><'pagination'p>>",
        'sPaginationType': 'bootstrap',
        'oLanguage': {
            'oAria': {
                'sSortAscending': ' - click/return to sort ascending',
                'sSortDescending': ' - click/return to sort descending'
            },
            'sProcessing': 'Carregando',
            'sLengthMenu': 'Exibir: _MENU_',
            'sZeroRecords': 'Nenhum resultado encontrado',
            'sInfo': 'Exibindo _START_ até _END_ de _TOTAL_',
            'sInfoEmpty': 'Nenhum resultado encontrado',
            'sInfoFiltered': '(Filtrados de um total de _MAX_ Resultados)',
            'sInfoPostFix': '',
            'sSearch': 'Filtrar por: ',
            'sSearchPlaceholder' : '',
            'oPaginate': {
                'sFirst': 'Primeira',
                'sPrevious': 'Anterior',
                'sNext': 'Próxima',
                'sLast': 'Última'
            }
        }
    });

    /**
     * As informações sobre paginação.
     * @param  {[type]} oSettings Configurações.
     */
    $.fn.dataTableExt.oApi.fnPagingInfo = function(oSettings)
    {
        return {
            'iStart': oSettings._iDisplayStart,
            'iEnd': oSettings.fnDisplayEnd(),
            'iLength': oSettings._iDisplayLength,
            'iTotal': oSettings.fnRecordsTotal(),
            'iFilteredTotal': oSettings.fnRecordsDisplay(),
            'iPage': Math.ceil(oSettings._iDisplayStart / oSettings._iDisplayLength),
            'iTotalPages': Math.ceil(oSettings.fnRecordsDisplay() / oSettings._iDisplayLength)
        };
    };

    /**
     * Extensão da configuração de paginação padrão do dataTables para
     * se adequar ao padrão de paginação do bootstrap
     */
    $.extend($.fn.dataTableExt.oPagination, {
        'bootstrap': {

            /**
             * Método de inicialização da paginação
             * @param  {object} oSettings As configurações.
             * @param  {int} nPaging .
             * @param  {boolean} fnDraw .
             */
            fnInit: function(oSettings, nPaging, fnDraw) {
                var oLang = oSettings.oLanguage.oPaginate;
                var fnClickHandler = function(e) {
                    e.preventDefault();
                    if (oSettings.oApi._fnPageChange(oSettings, e.data.action)) {
                        fnDraw(oSettings);
                    }
                };

                $(nPaging).addClass('pagination').append(
                    '<ul>' +
                        '<li class="prev disabled"><a href="#">&larr; ' + oLang.sPrevious + '</a></li>' +
                        '<li class="next disabled"><a href="#">' + oLang.sNext + ' &rarr; </a></li>' +
                    '</ul>'
                );
                var els = $('a', nPaging);
                $(els[0]).bind('click.DT', { action: 'previous' }, fnClickHandler);
                $(els[1]).bind('click.DT', { action: 'next' }, fnClickHandler);
            },

            /**
             * Método de update.
             * @param  {object} oSettings As configurações.
             * @param  {boolean} fnDraw    .
             */
            fnUpdate: function(oSettings, fnDraw) {
                var iListLength = 5;
                var oPaging = oSettings.oInstance.fnPagingInfo();
                var an = oSettings.aanFeatures.p;
                var i, iLen, j, sClass, iStart, iEnd, iHalf = Math.floor(iListLength / 2);

                if (oPaging.iTotalPages < iListLength) {
                    iStart = 1;
                    iEnd = oPaging.iTotalPages;
                }
                else if (oPaging.iPage <= iHalf) {
                    iStart = 1;
                    iEnd = iListLength;
                } else if (oPaging.iPage >= (oPaging.iTotalPages - iHalf)) {
                    iStart = oPaging.iTotalPages - iListLength + 1;
                    iEnd = oPaging.iTotalPages;
                } else {
                    iStart = oPaging.iPage - iHalf + 1;
                    iEnd = iStart + iListLength - 1;
                }

                var clickHandler = function(e) {
                    e.preventDefault();
                    oSettings._iDisplayStart = (parseInt($('a', this).text(), 10) - 1) * oPaging.iLength;
                    fnDraw(oSettings);
                };

                for (i = 0, iLen = an.length; i < iLen; i++) {
                    $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                    for (j = iStart; j <= iEnd; j++) {
                        sClass = (j === oPaging.iPage + 1) ? 'class="active"' : '';
                        $('<li ' + sClass + '><a href="#">' + j + '</a></li>')
                            .insertBefore($('li:last', an[i])[0])
                            .bind('click', clickHandler);
                    }

                    if (oPaging.iPage === 0) {
                        $('li:first', an[i]).addClass('disabled');
                    } else {
                        $('li:first', an[i]).removeClass('disabled');
                    }

                    if (oPaging.iPage === oPaging.iTotalPages - 1 || oPaging.iTotalPages === 0) {
                        $('li:last', an[i]).addClass('disabled');
                    } else {
                        $('li:last', an[i]).removeClass('disabled');
                    }
                }
            }
        }
    });

    if ($.fn.livequery) {
        $('[datatable]').livequery(function(event) {
            var $target = $(this);
            if ($target.is('table')) {
                $target.dataTable();
            }
        });
    }

}(jQuery));

/**
 * [options description]
 * @type {[type]}
 */
(function($) {
    $.mask.options = $.extend($.mask.options, {
      attr: 'mask',
      selectCharsOnFocus: true
    });

    $.mask.masks['numeric'] = { mask: '9', type: 'repeat' };
    $.mask.masks['alphanumeric'] = { mask: '@', type: 'repeat' };
    $.mask.masks['alpha'] = { mask: 'a', type: 'repeat' };

    if ($.fn.livequery) {
        $('[mask]').livequery(function(event) {
            var $target = $(this);

            if ($target.is(':input')) {
                $target.setMask();
            }
        });
    }
}(jQuery));

/**
 * Arquivo de configuração para os componentes do jQuery UI.
 * @author william.lepinski
 */
(function($) {

    'use strict';

    /**
     * Extendendo o prototype do $.validator
     */
    $.extend($.validator.prototype, {
        /**
         * Retorna o elemento para exibição do sumário de erro presente no formulário
         * @return {$} jQuery object com o elemento presente no formulário.
         */
        getErrorSummary: function() {
            return $(this.currentForm).find('.error-summary');
        }
    });

    $.extend($.validator.messages, {
        required: "Este campo &eacute; requerido.",
        remote: "Por favor, corrija este campo.",
        email: "Por favor, forne&ccedil;a um endere&ccedil;o eletr&ocirc;nico v&aacute;lido.",
        url: "Por favor, forne&ccedil;a uma URL v&aacute;lida.",
        date: "Por favor, forne&ccedil;a uma data v&aacute;lida.",
        dateISO: "Por favor, forne&ccedil;a uma data v&aacute;lida (ISO).",
        dateITA: " Por favor, forne&ccedil;a uma data v&aacute;lida.",
        number: "Por favor, forne&ccedil;a um n&uacute;mero v&aacute;lido.",
        digits: "Por favor, forne&ccedil;a somente d&iacute;gitos.",
        creditcard: "Por favor, forne&ccedil;a um cart&atilde;o de cr&eacute;dito v&aacute;lido.",
        equalTo: "Por favor, forne&ccedil;a o mesmo valor novamente.",
        accept: "Por favor, forne&ccedil;a um valor com uma extens&atilde;o v&aacute;lida.",
        maxlength: $.validator.format("Por favor, forne&ccedil;a n&atilde;o mais que {0} caracteres."),
        minlength: $.validator.format("Por favor, forne&ccedil;a ao menos {0} caracteres."),
        rangelength: $.validator.format("Por favor, forne&ccedil;a um valor entre {0} e {1} caracteres de comprimento."),
        range: $.validator.format("Por favor, forne&ccedil;a um valor entre {0} e {1}."),
        max: $.validator.format("Por favor, forne&ccedil;a um valor menor ou igual a {0}."),
        min: $.validator.format("Por favor, forne&ccedil;a um valor maior ou igual a {0}."),
        summary: $.validator.format("Seu formulário contém {0} {1}, verifique os detalhes acima"),
        error_singular: 'erro',
        error_plural: 'erros'
    });

    $.validator.setDefaults({

        validClass: 'success',
        errorClass: 'error',

        /**
         * Método que faz a tratativa para exibição de erros no
         * formulário sendo validado.
         *
         * @param  {[type]} errorMap  [description]
         * @param  {[type]} errorList [description]
         * @return {[type]}           [description]
         */
        showErrors: function(errorMap, errorList) {
            var $errorSummary = this.getErrorSummary();

            // Executa a exibição de erros padrão
            this.defaultShowErrors();

            // Caso não exista nenhum erro, não mostra o sumário de erros
            if(errorList.length === 0){
                $errorSummary.hide();
                return;
            }

            // Caso exista um sumário de erro presente no formulário, exibe com
            // a mensagem de erro
            if($errorSummary.length > 0) {
                var errorLabel = (this.numberOfInvalids() == 1) ? $.validator.messages.error_singular : $.validator.messages.error_plural;
                var message = $.validator.messages.summary(this.numberOfInvalids(), errorLabel);
                $errorSummary.show().html(message);
            }
        },

        /**
         * Método que determina onde a mensagem de erro deve aparecer.
         *
         * @param  {[type]} error   [description]
         * @param  {[type]} element [description]
         * @return {[type]}         [description]
         */
        errorPlacement: function(error, element) {
            error.addClass('help-block');
            error.appendTo(element.parents('.control-group').find('.controls'));
        },

        /**
         * Marca o campo com erro.
         *
         * @param  {[type]} element    [description]
         * @param  {[type]} errorClass [description]
         * @param  {[type]} validClass [description]
         * @return {[type]}            [description]
         */
        highlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group')
                .addClass(errorClass)
                .removeClass(validClass);
        },

        /**
         * Limpa o campo com erro e marca o campo como validado.
         *
         * @param  {[type]} element    [description]
         * @param  {[type]} errorClass [description]
         * @param  {[type]} validClass [description]
         * @return {[type]}            [description]
         */
        unhighlight: function(element, errorClass, validClass) {
            $(element).parents('.control-group')
                .removeClass(errorClass)
                .addClass(validClass);
        }
    });

    // Registra o seletor form[validation] no livequery
    if ($.fn.livequery) {
        $('form[validation]').livequery(function(event) {
            var $form = $(this);

            // Informa para o browser não efetuar a validação default do HTML5
            $form.attr('novalidate', 'novalidate');

            // Registra o event handler para o submit do formulário.
            $form.submit(function(event) {
                var valid = $form.validate({
                    rules: $form.data('validation-rules')
                }).form();

                if (!valid) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });
        });
    }

    $.fn.extend({
        /**
         * [setValidationRules description]
         */
        setValidationRules: function(rules){
            $(this).data('validation-rules', rules);
        }
    });
}(jQuery));

/*global jQuery:true*/
!(function($) {
    if ($.fn.livequery) {
        $('textarea, input').livequery(function(event) {
            $(this).placeholder();
        });
    }
}(jQuery));

/**
 * Arquivo de configuração para os componentes do jQuery UI.
 * @author william.lepinski
 */
(function($) {
    /**
     * Internacionalização do datepicker para pt-br
     */
    $.datepicker.regional['pt-BR'] = {
        closeText: 'Fechar',
        prevText: '&#x3c;Anterior',
        nextText: 'Pr&oacute;ximo&#x3e;',
        currentText: 'Hoje',
        monthNames: ['Janeiro', 'Fevereiro', 'Mar&ccedil;o', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        dayNames: ['Domingo', 'Segunda-feira', 'Ter&ccedil;a-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'S&aacute;bado'],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S&aacute;b'],
        dayNamesMin: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S&aacute;b'],
        weekHeader: 'Sm',
        dateFormat: 'dd/mm/yy',
        firstDay: 0,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''};
    $.datepicker.setDefaults($.datepicker.regional['pt-BR']);

    if ($.fn.livequery) {
        $('[datepicker]').livequery(function(event) {
            var $target = $(this);
            if ($target.is(':input')) {
                $target.datepicker();
            }
        });
    }
}(jQuery));

// =============================================================
// Tradução do Moment.js para pt-br 
// TODO - Mover para o vendors
// ==========================================================

(function(moment) {
  if (moment) {
    moment.lang('pt-br', {
      months        : ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
      monthsShort   : ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
      weekdays      : ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
      weekdaysShort : ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
      weekdaysMin   : ['Dom','2ª','3ª','4ª','5ª','6ª','Sáb'],
      longDateFormat: {
        LT   : 'HH:mm',
        L    : 'DD/MM/YYYY',
        LL   : 'D \\de MMMM \\de YYYY',
        LLL  : 'D \\de MMMM \\de YYYY LT',
        LLLL : 'dddd, D \\de MMMM \\de YYYY LT'
      },
      calendar: {
        sameDay  : '[Hoje às] LT',
        nextDay  : '[Amanhã às] LT',
        nextWeek : 'dddd [às] LT',
        lastDay  : '[Ontem às] LT',
        lastWeek: function() {
          if (this.day() === 0 || this.day() === 6) {
            return '[Último] dddd [às] LT';
          } else {
            return '[Última] dddd [às] LT';
          }
        },
        sameElse: 'L'
      },
      relativeTime: {
        future : 'em %s',
        past   : '%s atrás',
        s      : 'segundos',
        m      : 'um minuto',
        mm     : '%d minutos',
        h      : 'uma hora',
        hh     : '%d horas',
        d      : 'um dia',
        dd     : '%d dias',
        M      : 'um mês',
        MM     : '%d meses',
        y      : 'um ano',
        yy     : '%d anos'
      },
      ordinal: '%dº'
    });
  }
}(moment));
/*global setTimeout:true*/
(function($) {
    // Executar logo após o carregamento completo da página
    $(function() {
        // Procura o link que abre o dropdown menu com as
        // notificações disponíveis
        $('.notification-toggle').each(function() {
            var notificationToggle = $(this);
            // Procura pelo notification center na barra de navegação do sistema
            var noteCenter = notificationToggle.parents('.notification-center');
             // Contador de notificações
            var notificationCounter = noteCenter.find('.notification-counter');
            var notificationsAvailable = parseInt(notificationCounter.text(), 10);

            if (notificationsAvailable === 0) {
                notificationCounter.hide();
                return;
            }
            else {
                // Quando o usuário clicar no link, devemos ocultar o
                // contador caso não existam notificações não lidas a serem
                // verificadas pelo usuário
                notificationToggle.one('click', function(event) {
                    // Devemos chamar a operação remota para enviar o id da ultima notificação
                    // não lida, para que no próximo request ela não seja mais exibida como
                    // uma notificação não lida.
                    var lastUnreadNotification = noteCenter.find('.notifications .notification:first-child')
                        .data('id');

                    // Remove a classe .notification-unread de todas as
                    // notificações listadas
                    setTimeout(function() {
                        noteCenter.find('.notification')
                            .removeClass('notification-unread');
                    }, 500);

                    notificationCounter.animate({
                        opacity: 0
                    });
                });
            }
        });
    });

}(jQuery));

/*global window:true*/
!(function($){

  $('body').on('click.page.print', '.print-page', function(event){
    window.print();
    event.preventDefault();
  });

}(jQuery));
/*global document:true*/
!(function($){

    "use strict";

    function TextareaLimit(element, options){
        this.$textarea = $(element);
        this.options = $.extend({}, $.textareaLimit.defaults, options);

        if(this.options.label){
            this.labelElement = $(this.options.label);
        }
        else {
            var $label = $('<label></label>');
            this.$textarea.after($label);
            this.labelElement = $label;
        }

        if(!this.$textarea.is('textarea')){
            throw new Error('The data [data-textarea-range] should be used only with textarea elements');
        }

        this.init();
    }

    /**
     * [prototype description]
     * @type {Object}
     */
    TextareaLimit.prototype = {
        /**
         * [init description]
         */
        init : function(){
            this.$textarea.removeAttr('maxlength');

            this.$textarea.keyup($.proxy(this.change, this));
            this.updateLabel();
        },

        /**
         * [updateLabel description]
         * @return {[type]} [description]
         */
        updateLabel: function(){
            var text = this.$textarea.val();
            text = text.replace(/\u000d\u000a/g,'\u000a').replace(/\u000a/g,'\u000d\u000a');
            var availableCount = Math.abs(text.length - this.options.maxlength);
            var message = this.options.labelText.replace(/\{\#\}/g, availableCount);
            this.labelElement.text(message);
        },

        /**
         * [change description]
         * @param  {[type]} event [description]
         * @return {[type]}       [description]
         */
        change : function(event){
            var text = this.$textarea.val();
            text = text.replace(/\u000d\u000a/g,'\u000a').replace(/\u000a/g,'\u000d\u000a');

            if(text.length >= this.options.maxlength){
                this.$textarea.val(text.slice(0, this.options.maxlength));
            }

            this.updateLabel();
        }
    };

    /**
     * [textareaLimit description]
     * @param  {[type]} option [description]
     * @return {[type]}        [description]
     */
    $.fn.textareaLimit = function ( option ) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('textareaLimit'),
                options = typeof option === 'object' && option;

            if (!data || typeof data === 'string'){
                $this.data('textareaLimit', (data = new TextareaLimit(this, options)));
            }

            if (typeof option === 'string'){
                data[option]();
            }
        });
    };

    $.textareaLimit = {};
    $.textareaLimit.defaults = {
        labelText: 'Restam {#} caracteres',
        defaultMaxLength: !('maxLength' in document.createElement('textarea'))
    };

    $.fn.textareaLimit.Constructor = TextareaLimit;

    if ($.fn.livequery) {
        $('textarea[maxlength]').livequery(function(event) {
            var $target = $(this),
                data = $target.data();

            data = $.extend(data, {
                maxlength : $target.attr('maxlength')
            });

            $target.textareaLimit(data);
        });
    }
}(jQuery));


/*global Spinner:true*/
!(function($) {
  var options = {};
  options.small = {
    lines: 7,
    length: 2,
    width: 2,
    radius: 4,
    rotate: 0,
    color: '#000',
    speed: 1.7,
    trail: 44,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: 'auto'
  };

  options.normal = {
    lines: 9,
    length: 6,
    width: 3,
    radius: 6,
    rotate: 0,
    color: '#000',
    speed: 1.7,
    trail: 40,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: 'auto'
  };

  options.big = {
    lines: 9,
    length: 12,
    width: 5,
    radius: 13,
    rotate: 0,
    color: '#000',
    speed: 1.7,
    trail: 40,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: 'auto'
  };

  if ($.fn.livequery) {
    $('[spin]').livequery(function(event) {
      var size = $(this).data('size') || "normal";
      new Spinner(options[size]).spin(this);
    });
  }

}(jQuery));
(function() {

	_.mixin({
		capitalize : function(string) {
			return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
		},

		generateOptions: function (collection, propId, propName, sizeLimit) {
      var optionsCont = [];
      
      var options = {};

      if (collection && collection.models && collection.models.length) {
        if (!propId)    { propId    = 'id'  ; }
        if (!propName)  { propName  = 'nome'; }
        if (!sizeLimit) { sizeLimit = 60    ; }
        
        $.each(collection.models, function(i, model){
          if (model.get(propName)) {
            if (model.get(propName).length > sizeLimit) {
              model.set(propName, model.get(propName).substr(0, sizeLimit) + '...');
            }
            
            options = {};
            options[ model.get(propId) ] = model.get(propName);
            optionsCont.push(options);
          }
        });
      } 

      return optionsCont;
    },

    removeItem : function (list, item) {
      newList = [];
      _.each(list, function(el, i){
        if (!_.isEqual(el, item)) { newList.push(el); }
      });
      list = newList;
      return list;
    }

	});

}());