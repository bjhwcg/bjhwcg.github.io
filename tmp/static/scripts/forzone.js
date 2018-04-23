//鼠标单击文本框时
function formTip(obj, tipcolor) {
    var tipcolor = arguments[1] ? tipcolor : '#ACA899';//默认提示文字颜色
    var tipVal = obj.defaultValue;//提示文字就是默认的value值

    obj.style.color = tipcolor;
    obj.onfocus = function () {
        if (obj.value == tipVal) {
            obj.value = '';
            obj.style.color = '';//添加的提示颜色
        }
    }

    obj.onblur = function () {
        if (obj.value == '') {
            obj.value = tipVal;
            obj.style.color = tipcolor;
        }
    }

}
function getRandomColor() {

    return '#' +

        (function (color) {

            return (color += '0123456789abcdef'[Math.floor(Math.random() * 5)])

                && (color.length == 6) ? color : arguments.callee(color);

        })('');

}

window.onload = function () {
    formTip(document.getElementById("new-show-text"));

    //限制文本框字数
    $("#new-show-text").on("input propertychange",  function ()  {
                var  $this  =  $(this),
                        _val  =  $this.val(),
                        count  =  "";
                if  (_val.length  >  100)  {
                        $this.val(_val.substring(0,  100));
                }
                count  =  100  -  $this.val().length;
                $("#text-count").text(count);
    }); 

    //显示上传的图片一把鼻涕一把泪终于显示出来了……
    $('#new-show-file').change(function () {

        var f = document.getElementById('new-show-file').files[0];
    
        var src = window.URL.createObjectURL(f);

        document.getElementById('new-show-img').src = src;


    });
    //随机字体颜色
    for (var i = 0; i < 10; i++) {
        $('div.post-date')[i].style.color = getRandomColor();
    }
    /*这段代码试过了不能用
    $("#new-show-file").on("input", function () {

        //var imgFile = this.files[0];
        //var fr = new FileReader();
        //fr.onload = function () {
        //document.getElementById('new-show-img')[0].src = document.getElementById('new-show-file')[0].text.val();//= fr.result;
        //};
        //fr.readAsDataURL(imgFile);
    })*/



    //user-posts的高度变化
    var h = 110 * $('#user-posts').find("li").length;
    var sh = (h + 70).toString() + 'px';
    $('#user-posts')[0].style.height = sh;



}

//function e(){
//    document.write("<img src='../static/output.png?v=" + new Date().getTime() + "'>");
//}