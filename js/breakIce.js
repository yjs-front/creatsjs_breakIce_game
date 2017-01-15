var cjs = window.createjs,
    canvas,
    intro, // 活动介绍页
    iceGame, // 游戏页面
    recordS, // 个人记录页
    music, // 游戏音乐控制
    dialog, // 各类弹窗
    scale, // 元素缩放比例
    source, // 资源
    stage, // 画布
    w, // 页面宽度
    h, // 页面高度
    config = {// 配置信息
        isLogin: false,
        isWexin: /MicroMessenger/i.test(navigator.userAgent),
        isApp: /yyfax/i.test(navigator.userAgent),
        appVersion: navigator.userAgent.substring(navigator.userAgent.length - 5, navigator.userAgent.length).replace(/[^0-9]/ig, ''),
        playAudio: true,
        inviteFriend: 0,
        affectFriend: 0,
        leftChance: 0
    },
    util = {};

window.config = config;

/**
 *分享修改
 * @param {any} type
 */
util.shareActivity = function(type) {
    if (!config.isWexin) {
        return;
    }

    var mytitle, mylink, myimgUrl, mydesc;

    if (type === 'invite') {
        mylink = location.protocol + '//' + location.host + '/h5/activity/appRegister.html?code=' + config.code;
        mytitle = '送你58元投资红包，赶紧来注册吧！';
        myimgUrl = window.location.origin + '/images/h5/game/breakIce/wechat_icon.jpg';
        mydesc = '友金所，年化收益最高12%，快来跟我一起赚钱吧！';
    } else {
        mylink = location.href;
        mytitle = '呼朋唤友 立享加息';
        myimgUrl = window.location.origin + '/images/h5/game/breakIce/wechat_icon.jpg';
        mydesc = '我真的赚翻了~，拼手速的时刻你准备好了么？';
    }

    // window.yyfax.util.shareTimeline(mytitle, mylink, myimgUrl, mydesc);
};

util.showShareMsk = function() {
    var msk = document.getElementById('wechat_mask');

    msk.style.display = 'block';
    function hideMsk() {
        msk.style.display = 'none';
        msk.removeEventListener('click', hideMsk);
    }

    msk.addEventListener('click', hideMsk);

};

util.resetBgPos = function(bg) {
    var bili = h / bg.image.height;

    bg.scaleX = bg.scaleY = bili;
    bg.x = -(bg.image.width * bili - w) / 2;
    scale = bili;
    return bili;
};

util.getInitDataB = function(callback) {
    var res = {
        status: 'success',
        content: {
            myCode: 'demo',
            shareRegisterCount: '2',
            registerInvestCount: '0',
            chanceCout: config.leftChance,
            isLogin: true
        }
    };

    if (callback) {
        callback(res);
    }
};

util.getPrice = function(callback) {
    if (config.leftChance > 0) {
        --config.leftChance;
    }

    var res = {
        status: 'success',
        content: {
            chanceCout: config.leftChance,
            price: '0.8',
            isLogin: true
        }
    };

    if (callback) {
        callback(res);
    }
};

util.gameFail = function(callback) {
    if (config.leftChance > 0) {
        --config.leftChance;
    }

    var res = {
        status: 'success',
        content: {
            chanceCout: config.leftChance,
            isLogin: true
        }
    };

    if (callback) {
        callback(res);
    }
};

util.ajax = function(options) {
    var xmlhttp = new XMLHttpRequest();

    function handleReq() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var b = xmlhttp.responseText;

            if (b) {
                b = JSON.parse(b);
            }

            options.success && options.success(b);
        }
    }

    xmlhttp.onreadystatechange = handleReq;
    xmlhttp.onerror = function() {
        dialog.netWorkExc();
    };

    xmlhttp.ontimeout = function() {
        dialog.netWorkExc();
    };

    xmlhttp.open(options.type || 'GET', options.url, true);
    xmlhttp.send(options.data);
};

util.setInvite = function() {
    document.getElementById('invite_count').innerText = config.inviteFriend || 0;
    document.getElementById('invite_affect').innerText = config.affectFriend || 0;

};

/**
 * 游戏资源加载
 */
function Resource() {
    this.preload = null;
}


/**
 * 获取资源
 * @param {any} name
 */
Resource.prototype.getResult = function(name) {
    if (name) {
        return this.preload.getResult(name);
    } else {
        return null;
    }
};

/**
 * 加载资源
 * @param {any} callback 加载完成回调
 */
Resource.prototype.loadResource = function(callback) {
    var manifest,
        self = this,
        loadTxt = document.getElementById('load_txt');

    manifest = [
        {
            src: 'intro_bg.png', id: 'intro_bg'
        },
        {
            src: 'game_bg.png', id: 'game_bg'
        },
        {
            src: 'record_bg.png', id: 'record_bg'
        },
        {
            src: 'common/bitmapTxt.png', id: 'bitmapText'
        },
        {
            src: 'common/whiteTxt.png', id: 'witheText'
        },
        {
            src: 'game-s8bc64cd9ef.png', id: 'game'
        },
        {
            src: 'game_common-sfaad0e1196.png', id: 'common'
        },
        {
            src: 'progress_bg.png', id: 'progress'
        },
        {
            src: 'tick-s14ebc023ff.png', id: 'tick'
        },
        {
            src: '/js/lib/createjs/tweenjs-0.6.2.min.js', id: 'tween'
        },
        {
            src: '/js/resource/breakIce/bgm.ogg', id: 'bgm'
        },
        {
            src: '/js/resource/breakIce/boom.wav', id: 'boom'
        },
        {
            src: '/js/resource/breakIce/break.wav', id: 'break'
        },
        {
            src: '/js/resource/breakIce/ycode.wav', id: 'ycode'
        },
        {
            src: '/js/resource/breakIce/hit.wav', id: 'hit'
        }
    ];

    if (config.isWexin) {
        // manifest.push({
        //     src: '/js/wechat/jweixin-1.0.0.js', id: 'weixin'
        // });
    }

    // 处理单个文件加载
    function handleFileLoad(event) {
        // console.log('文件类型: ' + event.item.type + ' name:' + event.item.src + ' progress:' + (event.target.progress* 100 | 0));
    }

    // 处理加载错误：大家可以修改成错误的文件地址,可在控制台看到此方法调用
    function loadError(evt) {
        console.log('加载出错！', evt.text);
    }


    // 已加载完毕进度
    function handleFileProgress() {
        loadTxt.innerText = (self.preload.progress * 100 | 0) + ' %';
    }

    // 全部资源加载完毕
    function loadComplete() {
        console.log('已加载完毕全部资源');
        document.getElementById('caseBlanche').style.display = 'none';
        self.initSprite();
        callback && callback();
    }

    this.preload = new cjs.LoadQueue(true);

    cjs.Sound.alternateExtensions = ['mp3'];
    this.preload.installPlugin(cjs.Sound);

    // 注意加载音频文件需要调用如下代码行
    this.preload.on('fileload', handleFileLoad);
    this.preload.on('progress', handleFileProgress);
    this.preload.on('complete', loadComplete);
    this.preload.on('error', loadError);
    this.preload.loadManifest(manifest, true, '/images/breakIce/');

};

Resource.prototype.initSprite = function() {
    var indexFontdata = {
        animations: {
            0: [0],
            1: [1],
            2: [2],
            3: [3],
            4: [4],
            5: [5],
            6: [6],
            7: [7],
            8: [8],
            9: [9],
            x: [10]
        },
        images: [this.getResult('bitmapText')],
        frames: {
            width: 44,
            height: 44
        }
    },
        whiteData = {
            animations: {
                0: [0],
                1: [1],
                2: [2],
                3: [3],
                4: [4],
                5: [5],
                6: [6],
                7: [7],
                8: [8],
                9: [9]
            },
            images: [this.getResult('witheText')],
            frames: {
                width: 44,
                height: 44
            }
        },
        gameData = {
            images: [this.getResult('game')],
            frames: [
                [24, 355, 97, 90],
                [0, 0, 118, 127],
                [499, 873, 267, 316],
                [499, 1297, 267, 316],
                [0, 3495, 499, 450],
                [0, 2145, 499, 450],
                [0, 2595, 499, 450],
                [0, 3045, 499, 450],
                [0, 4506, 859, 861],
                [118, 0, 296, 355],
                [121, 355, 89, 94],
                [210, 355, 89, 94],
                [0, 355, 24, 30],
                [299, 355, 493, 52],
                [0, 3945, 569, 561],
                [0, 873, 499, 424],
                [0, 1721, 499, 424],
                [0, 1297, 499, 424],
                [0, 449, 499, 424]
            ],
            animations: {
                clock: [0],
                count_bg: [1],
                hammer1: [2],
                hammer2: [3],
                ice0: [4],
                ice1: [5],
                ice2: [6],
                ice3: [7],
                ice_break: [8],
                ice_ycode: [9],
                music_off: [10],
                music_on: [11],
                progress_bg: [12],
                progress_ctn: [13],
                suc_ycode: [14],
                b_ice0: [15],
                b_ice1: [16],
                b_ice2: [17],
                b_ice3: [18]
            }
        },
        commonData = {
            images: [this.getResult('common')],
            frames: [
                [251, 439, 251, 107],
                [0, 885, 369, 153],
                [398, 118, 251, 107],
                [338, 225, 251, 107],
                [0, 1038, 369, 153],
                [398, 0, 251, 107],
                [0, 439, 251, 107],
                [0, 332, 251, 107],
                [147, 0, 251, 107],
                [0, 762, 454, 123],
                [251, 332, 251, 107],
                [0, 1906, 617, 447],
                [0, 2353, 656, 617],
                [0, 225, 87, 87],
                [0, 0, 147, 118],
                [251, 546, 398, 108],
                [211, 654, 396, 108],
                [0, 1191, 613, 176],
                [0, 654, 211, 53],
                [0, 1367, 704, 177],
                [0, 1544, 626, 362],
                [190, 118, 208, 88],
                [87, 225, 251, 107],
                [0, 546, 251, 107],
                [0, 118, 190, 53]
            ],
            animations: {
                btn_again: [0],
                btn_begin: [1],
                btn_finsh: [2],
                btn_go: [3],
                btn_gray: [4],
                btn_invest: [5],
                btn_invite: [6],
                btn_no: [7],
                btn_ok: [8],
                btn_task: [9],
                btn_view: [10],
                dialog: [11],
                dialog_big: [12],
                dialog_close: [13],
                flag_record: [14],
                result_fail: [15],
                result_suctxt: [16],
                tip_game: [17],
                tip_gameStart: [18],
                tip_outoftime: [19],
                tip_title: [20],
                rule: [21],
                btn_login: [22],
                btn_iknow: [23],
                rule_title: [24]
            }
        },
        tickData = {
            framerate: 1,
            images: [this.getResult('tick')],
            frames: {
                regX: 0, height: 319, count: 4, regY: 0, width: 385
            },
            animations: {
                count3: [2],
                count2: [1],
                count1: [0],
                stop: [3]
            }
        };

    this.indexfont = new cjs.SpriteSheet(indexFontdata);
    this.wihtefont = new cjs.SpriteSheet(whiteData);
    this.gameData = new cjs.SpriteSheet(gameData);
    this.common = new cjs.SpriteSheet(commonData);
    this.tick = new cjs.SpriteSheet(tickData);
};

/**
 * 游戏核心
 */
function IceGame(option) {
    this.gameHit = 0;
    this.gameCtn = null;
    this.maskCtn = null;
    this.ctn = null;
    this.isShow = false;
    this.isInit = false;
    this.scale = 1;
    this.gameConfig = {
        leastHit: option.leastHit,
        time: option.time,
        leftProgress: 0,
        progressHeight: 0,
        xStart: 0 // x坐标起点
    };
    this.gameStatus = {};
    this._init = function() {
        if (this.isInit) {
            return;
        }

        var gameCtn,
            bg,
            scale, xStart,
            progressCtn,
            ice,
            iceBreak,
            iceScale,
            iceYcode,
            hammer,
            countBg,
            countTxt,
            gameMsk,
            resultMsk,
            self = this;

        this.gameHit = 0;
        this.ctn = new cjs.Container();
        this.ctn.visible = false;

        gameCtn = new cjs.Container();
        gameCtn.name = 'game';
        this.gameCtn = gameCtn;

        bg = new cjs.Bitmap(source.getResult('game_bg'));
        scale = this.scale = util.resetBgPos(bg);

        this.ctnWidth = bg.getBounds().width;

        xStart = this.gameConfig.xStart;
        if (bg.x > 0) {
            xStart = this.gameConfig.xStart = bg.x;
        }

        progressCtn = this._addProgressCtn();
        progressCtn.name = 'progressCtn';

        ice = new cjs.Sprite(source.gameData, 'ice0');
        ice.name = 'ice';
        ice.scaleX = ice.scaleY = scale;
        ice.regX = ice.getBounds().width / 2 * scale;
        ice.regY = ice.getBounds().height / 3 * scale;
        ice.y = ice.regY * scale + 500 / 650 * h - ice.getBounds().height * scale;
        ice.x = ice.regX * scale * 2 + stage.canvas.width - ice.getBounds().width * scale >> 1;

        iceBreak = new cjs.Sprite(source.gameData, 'ice_break');
        iceBreak.name = 'ice_break';

        iceScale = 0.9;
        iceBreak.scaleX = iceBreak.scaleY = iceScale;
        iceBreak.visible = 0;
        iceBreak.y = 600 / 650 * h - iceBreak.getBounds().height * iceScale - 100 * scale;
        iceBreak.x = stage.canvas.width - iceBreak.getBounds().width * iceScale >> 1;

        iceYcode = new cjs.Sprite(source.gameData, 'ice_ycode');
        iceYcode.name = 'ice_ycode';
        iceYcode.scaleX = iceYcode.scaleY = scale;
        iceYcode.visible = 0;
        iceYcode.y = 500 / 650 * h - iceYcode.getBounds().height * scale;
        iceYcode.x = stage.canvas.width - iceYcode.getBounds().width * scale >> 1;

        hammer = new cjs.Sprite(source.gameData, 'hammer1');
        hammer.name = 'hammer';
        hammer.scaleX = hammer.scaleY = scale;
        hammer.y = ice.y - hammer.getBounds().height * scale;
        hammer.x = (stage.canvas.width - hammer.getBounds().width * scale >> 1) + 160 * scale;
        hammer.visible = 0;

        countBg = new cjs.Sprite(source.gameData, 'count_bg');
        countBg.name = 'countBg';
        countBg.scaleX = countBg.scaleY = scale;
        countBg.y = hammer.y - countBg.getBounds().height * scale / 2;
        countBg.x = hammer.x + hammer.getBounds().width * scale - 100 * scale;
        countBg.visible = 0;

        countTxt = new cjs.BitmapText('0', source.indexfont);
        countTxt.name = 'countNum';
        countTxt.scaleX = countTxt.scaleY = scale;
        countTxt.x = countBg.x + (countBg.getBounds().width - countTxt.getBounds().width) / 2 * scale;
        countTxt.y = countBg.y + (countBg.getBounds().height - countTxt.getBounds().height) / 2 * scale;
        countTxt.visible = 0;

        gameMsk = this._addMask();
        gameMsk.name = 'mask';

        resultMsk = this._addResultMask();
        resultMsk.name = 'result';

        gameCtn.addChild(progressCtn, ice, iceYcode, iceBreak, hammer, countBg, countTxt);

        this.progressCtn = progressCtn;
        this.maskCtn = gameMsk;
        this.resultCtn = resultMsk;
        this.ctn.addChild(bg, gameCtn, gameMsk, resultMsk);
        this.addEvent();
        this.isInit = true;

        function tick(event) {
            self.tick(event);
        }

        cjs.Ticker.timingMode = cjs.Ticker.RAF;
        cjs.Ticker.addEventListener('tick', tick);

        stage.addChild(this.ctn);
    };

    this.show = function() {
        this.ctn.visible = true;
        stage.update();
    };

    this._addProgressCtn = function() {
        var progressCtn = new cjs.Container(),
            bili,
            scale = this.scale,
            clock,
            progress, progressBounds,
            progressLine,
            progressBorder, mtx,
            clockTxt,
            music;

        clock = new cjs.Sprite(source.gameData, 'clock');
        clock.name = 'clock';
        clock.scaleX = clock.scaleY = this.scale;
        clock.x = 10 * this.scale;
        clock.y = 10 / 650 * h;

        progress = new cjs.Sprite(source.gameData, 'progress_ctn');
        progressBounds = progress.getBounds();
        progress.scaleX = progress.scaleY = this.scale;
        progress.y = clock.y + (clock.getBounds().height - progress.getBounds().height) / 2 * this.scale;
        progress.x = clock.x + clock.getBounds().width * this.scale - 30 * this.scale;

        progressLine = new cjs.Shape();
        progressBorder = 3.5 / 650 * h;
        progressLine.name = 'progress';
        this.gameConfig.leftProgress = progressBounds.width * this.scale - progressBorder * 2;
        this.gameConfig.progressHeight = progressBounds.height * this.scale - progressBorder * 2 - 5 * scale;
        mtx = new cjs.Matrix2D();
        mtx.scale(this.scale, this.scale);
        progressLine.graphics.beginBitmapFill(source.getResult('progress'), 'repeat', mtx)
            .drawRoundRectComplex(0, 0, this.gameConfig.leftProgress, this.gameConfig.progressHeight, 8, 8, 8, 8);
        progressLine.x = progress.x + progressBorder;
        progressLine.y = progress.y + progressBorder;

        clockTxt = new cjs.BitmapText(this.gameConfig.time.toString(), source.wihtefont);
        clockTxt.name = 'clockTxt';
        clockTxt.scaleX = clockTxt.scaleY = scale;
        clockTxt.x = progress.x + (5 + progressBounds.width) * scale;
        clockTxt.y = progress.y + 5 * scale;

        music = new cjs.Sprite(source.gameData, 'music_on');
        music.name = 'music';
        music.scaleX = music.scaleY = this.scale;
        music.x = clockTxt.x + (clockTxt.getBounds().width + 25) * this.scale;
        music.y = clock.y;

        progressCtn.addChild(progressLine, progress, clock, clockTxt, music);
        bili = stage.canvas.width / (music.x + music.getBounds().width * scale + 10 * scale);
        if (this.gameConfig.xStart > 0) {
            bili = this.ctnWidth * scale / (music.x + music.getBounds().width * scale + 10 * scale);
            progressCtn.x = this.gameConfig.xStart;
        }

        progressCtn.scaleX = progressCtn.scaleY = bili;

        return progressCtn;
    };

    this._addMask = function() {
        var gameMask = new cjs.Container(),
            mask,
            coutDown;

        mask = new cjs.Shape();
        mask.graphics.beginFill('#000').drawRect(0, 0, w, h);
        mask.alpha = 0.7;

        coutDown = new cjs.Sprite(source.tick, 'count3');
        coutDown.name = 'countdown';
        coutDown.y = 200 / 650 * h;
        coutDown.x = stage.canvas.width - coutDown.getBounds().width * scale >> 1;
        coutDown.scaleX = coutDown.scaleY = scale;

        gameMask.addChild(mask, coutDown);

        return gameMask;
    };

    this._addResultMask = function() {
        var resultMask = new cjs.Container(),
            mask,
            sucTxt,
            failTxt,
            text,
            price,
            ice,
            btnAgain,
            btnView,
            btnTask;

        mask = new cjs.Shape();
        mask.graphics.beginFill('#000').drawRect(0, 0, w, h);
        mask.alpha = 0.7;

        sucTxt = new cjs.Sprite(source.common, 'result_suctxt');
        sucTxt.name = 'sucTxt';
        sucTxt.visible = 0;
        sucTxt.scaleX = sucTxt.scaleY = scale;
        sucTxt.y = 100 / 650 * h;
        sucTxt.x = stage.canvas.width - sucTxt.getBounds().width * scale >> 1;

        failTxt = new cjs.Sprite(source.common, 'result_fail');
        failTxt.name = 'failTxt';
        failTxt.visible = 0;
        failTxt.scaleX = failTxt.scaleY = scale;
        failTxt.y = sucTxt.y;
        failTxt.x = sucTxt.x;

        text = new cjs.Text('', 'bold ' + 30 * scale + 'px Heiti SC,Microsoft YaHei', '#fff');
        text.name = 'resultMsg';
        text.y = 180 / 650 * h;
        text.lineWidth = w - 20 * scale;
        text.lineHeight = 20 * scale;

        text.textBaseline = 'alphabetic';

        price = new cjs.Sprite(source.gameData, 'suc_ycode');
        price.name = 'ycode';
        price.visible = 0;
        price.scaleX = price.scaleY = scale;
        price.y = 200 / 650 * h;
        price.x = stage.canvas.width - price.getBounds().width * scale >> 1;

        ice = new cjs.Sprite(source.gameData, 'b_ice0');
        ice.name = 'ice';
        ice.visible = 0;
        ice.scaleX = ice.scaleY = scale;
        ice.y = 220 / 650 * h;
        ice.x = stage.canvas.width - ice.getBounds().width * scale >> 1;

        btnAgain = new cjs.Sprite(source.common, 'btn_again');
        btnAgain.name = 'btnAgain';
        btnAgain.visible = 0;
        btnAgain.scaleX = btnAgain.scaleY = scale;
        btnAgain.y = 480 / 650 * h;
        btnAgain.x = stage.canvas.width - btnAgain.getBounds().width * scale >> 1;

        btnView = new cjs.Sprite(source.common, 'btn_view');
        btnView.name = 'btnView';
        btnView.visible = 0;
        btnView.scaleX = btnView.scaleY = scale;
        btnView.y = 480 / 650 * h;
        btnView.x = stage.canvas.width - btnView.getBounds().width * scale >> 1;

        btnTask = new cjs.Sprite(source.common, 'btn_task');
        btnTask.name = 'btnTask';
        btnTask.visible = 0;
        btnTask.scaleX = btnTask.scaleY = scale;
        btnTask.y = 480 / 650 * h;
        btnTask.x = stage.canvas.width - btnTask.getBounds().width * scale >> 1;

        resultMask.addChild(mask, sucTxt, failTxt, text, price, ice, btnAgain, btnView, btnTask);
        resultMask.visible = 0;

        return resultMask;
    };

    this.addEvent = function() {
        var self = this,
            timer = null;

        self.progressCtn.getChildByName('music').on('click', function() {
            if (config.playAudio) {
                this.gotoAndPlay('music_off');
                music.off();
            } else {
                this.gotoAndPlay('music_on');
                music.on();
            }

            config.playAudio = !config.playAudio;
        });
        stage.addEventListener('stagemousedown', function() {
            if (!self.gameStatus.run || self.gameStatus.runedTime < 4) {
                return;
            }

            clearTimeout(timer);
            self.gameHit++;
            music.play('hit');

            var countNum = self.gameCtn.getChildByName('countNum'),
                countBg = self.gameCtn.getChildByName('countBg'),
                hammer = self.gameCtn.getChildByName('hammer'),
                ice = self.gameCtn.getChildByName('ice');

            countNum.visible = 1;
            countBg.visible = 1;
            hammer.visible = 1;
            hammer.alpha = 1;
            hammer.gotoAndPlay('hammer1');
            countNum.text = self.gameHit.toString();
            if (self.gameHit === 1) {
                countNum.x = countBg.x + (countBg.getBounds().width - countNum.getBounds().width) / 2 * self.scale;
                countNum.y = countBg.y + (countBg.getBounds().height - countNum.getBounds().height - 6) / 2 * scale;
                countNum.scaleX = countNum.scaleY = self.scale;
            } else if (self.gameHit === 10) {
                countNum.x = countBg.x + (countBg.getBounds().width - countNum.getBounds().width) / 2 * self.scale;
            } else if (self.gameHit === 100) {
                countNum.y = countNum.y + countNum.getBounds().height * self.scale * (1 - 0.65) / 2;
                countNum.scaleX = countNum.scaleY = self.scale * 0.65;

                // countNum.y = countNum.y + countNum.getBounds().height * self.scale * (0.65 - 0.3) / 2;
                // countNum.scaleX = countNum.scaleY = self.scale * 0.3;
            }

            if (self.gameHit === self.gameConfig.leastHit) {
                self._gameOver();
            } else if (self.gameHit === parseInt(self.gameConfig.leastHit / 4 * 3)) {
                ice.gotoAndPlay('ice3');
                music.play('break');
            } else if (self.gameHit === parseInt(self.gameConfig.leastHit / 4 * 2)) {
                ice.gotoAndPlay('ice2');
                music.play('break');
            } else if (self.gameHit === parseInt(self.gameConfig.leastHit / 4 * 1)) {
                ice.gotoAndPlay('ice1');
                music.play('break');
            }

            timer = setTimeout(function() {
                countNum.visible = 0;
                countBg.visible = 0;
                hammer.visible = 0;
            }, 500);
        });
        stage.addEventListener('stagemouseup', function() {
            var hammer = self.gameCtn.getChildByName('hammer');

            hammer.gotoAndPlay('hammer2');
        });
        self.resultCtn.getChildByName('btnAgain').on('click', function() { // 再来一次
            self.gameRestart();
        });
        self.resultCtn.getChildByName('btnView').on('click', function() { // 查看
            self.screenOut();
            recordS.show();
        });
        self.resultCtn.getChildByName('btnTask').on('click', function() { // 做任务赢取更多
            self.screenOut();
            recordS.show();
        });
        self.resultCtn.addEventListener('click', function() { }, false);
        self.maskCtn.addEventListener('click', function() { }, false);
    };

    this.tick = function(event) {
        var self = this,
            pro,
            mtx,
            runedTime,
            clock,
            left,
            progressPc;

        if (self.isStart && !self.gameStatus.run) {
            self.gameStart.startTime = event.runTime;
            self.gameStatus.run = true;
        }

        if (self.gameStatus.run) {
            pro = self.progressCtn.getChildByName('progress');
            mtx = new cjs.Matrix2D();
            mtx.scale(scale, scale);
            runedTime = parseInt((event.runTime - self.gameStart.startTime) / 1000, 10);
            // 进度条和倒计时，倒计时结束执行gameOver方法
            if (self.gameStatus.runedTime !== runedTime) {
                self.gameStatus.runedTime = runedTime;
                if (runedTime === 1) {
                    self.maskCtn.getChildByName('countdown').gotoAndPlay('count2');
                } else if (runedTime === 2) {
                    self.maskCtn.getChildByName('countdown').gotoAndPlay('count1');
                } else if (runedTime === 3) {
                    self.maskCtn.getChildByName('countdown').gotoAndPlay('stop');
                } else if (runedTime === 4) {
                    self.maskCtn.visible = 0;
                    clock = self.progressCtn.getChildByName('clockTxt');
                    clock.visible = 1;
                    clock.text = self.gameStatus.time.toString();
                } else {
                    // console.log(runedTime);
                    left = self.gameStatus.time - runedTime + 4;
                    clock = self.progressCtn.getChildByName('clockTxt');
                    clock.visible = 1;
                    clock.text = left.toString();
                    progressPc = self.gameConfig.leftProgress * left / self.gameStatus.time;
                    if (left >= 0) {
                        pro.graphics.clear();
                    }

                    if (left > 0) {
                        pro.graphics.beginBitmapFill(source.getResult('progress'), 'repeat', mtx).
                            drawRoundRectComplex(0, 0, progressPc, self.gameConfig.progressHeight, 8, 8, 8, 8);
                    }

                    if (left <= 0) {
                        self._gameOver();
                    }
                }
            }
        }

        if (event.paused) {
            return;
        }

        stage.update();
    };

    this.gameStart = function() {
        this.isStart = true;
        this.gameStatus = {
            time: this.gameConfig.time,
            leftProgress: this.gameConfig.leftProgress,
            run: false,
            runedTime: 0
        };
    };

    this._gameOver = function() {
        // stop game tick
        this.gameStatus.run = false;
        this.isStart = false;

        var ice = this.gameCtn.getChildByName('ice'),
            that = this,
            stopShake = false;

        function shakeIce() {
            if (!stopShake) {
                cjs.Tween.get(ice).wait(10).to({
                    rotation: 2
                }, 100).wait(10).to({
                    rotation: -2
                }, 100).call(arguments.callee);
            }
        }

        if (this.gameHit < this.gameConfig.leastHit) { // 游戏不能通关
            config.leftChance--;

            util.gameFail(function(res) {
                config.leftChance = res.content.chanceCout;
                config.isLogin = res.content.isLogin;
            });

            this._showResult({
                result: false,
                leftChance: config.leftChance,
                breakLevel: parseInt(this.gameHit / this.gameConfig.leastHit * 4)
            });
            return;
        }

        shakeIce();

        util.getPrice(function(res) {
            stopShake = true;

            if (res.status !== 'success') {
                alert(res.msg || '网络异常,请稍后重试');
                window.location.reload();
            }

            config.leftChance = res.content.chanceCout;
            config.isLogin = res.content.isLogin;
            var price = '',
                gameResult = {
                    result: true,
                    leftChance: config.leftChance
                };

            if (res.content.prize === 0) {
                price = '0.8';
            } else if (res.content.prize === 1) {
                price = '0.5';
            } else if (res.content.prize === 2) {
                price = '0.3';
            } else if (res.content.prize === 3) {
                price = '0.2';
            }

            gameResult.price = price;

            config.leftChance = gameResult.leftChance;
            that._showResult(gameResult);
        });

        this.gameReset();
    };

    this._showResult = function(gameResult) {
        var ice = this.gameCtn.getChildByName('ice'),
            iceBreak = this.gameCtn.getChildByName('ice_break'),
            iceYcode = this.gameCtn.getChildByName('ice_ycode'),
            iceScale = this.scale,
            viewBtn = this.resultCtn.getChildByName('btnView'),
            againBtn = this.resultCtn.getChildByName('btnAgain'),
            taskBtn = this.resultCtn.getChildByName('btnTask'),
            sucTxt = this.resultCtn.getChildByName('sucTxt'),
            failTxt = this.resultCtn.getChildByName('failTxt'),
            yCode = this.resultCtn.getChildByName('ycode'),
            resulMsg = this.resultCtn.getChildByName('resultMsg'),
            resultIce = this.resultCtn.getChildByName('ice'),
            that = this;

        ice.visible = false;

        function showUnbrokeIce() {
            var levelText = 'b_ice' + gameResult.breakLevel;

            sucTxt.visible = 0;
            failTxt.visible = true;
            yCode.visible = 0;
            viewBtn.visible = 0;
            resultIce.visible = true;
            resultIce.gotoAndPlay(levelText);

            if (gameResult.leftChance) {
                resulMsg.text = '好可惜，没有获得Ycode哦，赶紧再试一\n\r次吧！';
                againBtn.visible = true;
                againBtn.x = stage.canvas.width - scale * againBtn.getBounds().width >> 1;
                taskBtn.visible = 0;
            } else {
                resulMsg.text = '好可惜，没有获得Ycode哦，游戏次数用\n\r完了，快去获得更多游戏次数吧~';
                againBtn.visible = 0;
                taskBtn.visible = true;
                taskBtn.x = stage.canvas.width - scale * taskBtn.getBounds().width >> 1;
            }

            resulMsg.x = stage.canvas.width - resulMsg.getBounds().width >> 1;
            that.resultCtn.visible = true;
        }

        function breakIce() {
            var baseX,
                moveDis;

            iceBreak.visible = 0;
            sucTxt.visible = true;
            failTxt.visible = 0;
            yCode.visible = true;
            resultIce.visible = 0;
            viewBtn.visible = true;
            iceYcode.visible = false;
            that.resultCtn.getChildByName('btnTask').visible = 0;
            resulMsg.text = '恭喜成功获得' + (gameResult.price ? gameResult.price + '%' : '') + 'Ycode1个，Ycode稍后会\n\r以站内信的形式发送给您，请注意查收！';
            if (gameResult.leftChance) {
                againBtn.visible = true;
                baseX = stage.canvas.width - scale * viewBtn.getBounds().width >> 1;
                moveDis = viewBtn.getBounds().width * scale / 2 + 20 * scale;
                viewBtn.x = baseX - moveDis;
                againBtn.x = baseX + moveDis;
            } else {
                againBtn.visible = 0;
                viewBtn.x = stage.canvas.width - scale * viewBtn.getBounds().width >> 1;
            }

            resulMsg.x = stage.canvas.width - resulMsg.getBounds().width >> 1;
            that.resultCtn.visible = true;
        }

        if (gameResult.result) {
            iceYcode.visible = true;
            music.play('boom', {
                offset: 500
            });
            music.play('ycode', {
                delay: 1050
            });
            cjs.Tween.get(iceBreak).to({
                visible: true
            }, 0).to({
                scaleX: iceScale, scaleY: iceScale,
                x: stage.canvas.width - iceBreak.getBounds().width * iceScale >> 1,
                y: 600 / 650 * h - iceBreak.getBounds().height * iceScale
            }, 1000, cjs.Ease.cubicIn)
                .wait(50).call(breakIce);
        } else {
            showUnbrokeIce(gameResult);
        }
    };

    this.gameReset = function() {
        this.isStart = false;
        this.gameStatus = {
            run: false,
            runedTime: 0
        };

    };

    this.gameRestart = function() {
        var ice,
            iceBreak,
            iceScale,
            progressLine, mtx;

        this.gameHit = 0;
        this.maskCtn.visible = true;
        this.resultCtn.visible = false;
        this.maskCtn.getChildByName('countdown').gotoAndPlay('count3');

        ice = this.gameCtn.getChildByName('ice');
        ice.visible = true;
        ice.gotoAndPlay('ice0');

        iceBreak = this.gameCtn.getChildByName('ice_break');
        this.gameCtn.getChildByName('ice_ycode').visible = false;

        iceScale = 0.9;
        iceBreak.scaleX = iceBreak.scaleY = iceScale;
        iceBreak.visible = 0;
        iceBreak.y = 600 / 650 * h - iceBreak.getBounds().height * iceScale - 100 * scale;
        iceBreak.x = stage.canvas.width - iceBreak.getBounds().width * iceScale >> 1;

        progressLine = this.progressCtn.getChildByName('progress');
        mtx = new cjs.Matrix2D();
        mtx.scale(this.scale, this.scale);
        progressLine.graphics.beginBitmapFill(source.getResult('progress'), 'repeat', mtx)
            .drawRoundRectComplex(0, 0, this.gameConfig.leftProgress, this.gameConfig.progressHeight, 8, 8, 8, 8);
        this.gameStart();
    };

    this.screenOut = function() {
        this.ctn.visible = false;
        stage.update();
    };

    this._init();
}

/**
 * 个人记录页
 */
function RecordScreen() {
    this.ctn = null;
    this.isShow = false;
    this.scale = 1;

    this._init = function() {
        var bg,
            scale,
            title,
            gameOut,
            backBtn,
            viewBtn,
            gameBtn,
            gameBtnTxt,
            bitmapText,
            tip1,
            btnInvite,
            btnInvest,
            baseX,
            moveDis,
            html,
            htmlEl;

        this.ctn = new cjs.Container();
        this.ctn.visible = false;
        bg = new cjs.Bitmap(source.getResult('record_bg'));
        this.scale = util.resetBgPos(bg);
        scale = this.scale;

        title = new cjs.Sprite(source.common, 'tip_game');
        title.name = 'title';
        title.x = stage.canvas.width - title.getBounds().width * scale >> 1;
        title.y = 70 / 650 * h;
        title.scaleX = title.scaleY = scale;

        gameOut = new cjs.Sprite(source.common, 'tip_outoftime');
        gameOut.name = 'gameOut';
        gameOut.x = stage.canvas.width - gameOut.getBounds().width * scale * 0.8 >> 1;
        gameOut.y = 70 / 650 * h;
        gameOut.scaleX = gameOut.scaleY = scale * 0.8;

        backBtn = new cjs.Shape();
        backBtn.name = 'backBtn';
        var backBtnTxt = new cjs.Text('<返回首页', 'bold ' + 28 * scale + 'px Heiti SC,Microsoft YaHei', '#fff');
        backBtnTxt.x = title.x;
        backBtnTxt.y = 160 / 650 * h;
        backBtn.graphics.beginFill('#000').drawRect(0, 0, backBtnTxt.getBounds().width * scale, (backBtnTxt.getBounds().height + 10) * scale);
        backBtn.x = backBtnTxt.x;
        backBtn.y = backBtnTxt.y;
        backBtn.alpha = 0.01;

        viewBtn = new cjs.Shape();
        viewBtn.name = 'viewBtn';
        var viewBtnTxt = new cjs.Text('查看我的Ycode>', 'bold ' + 28 * scale + 'px Heiti SC,Microsoft YaHei', '#fff');
        viewBtnTxt.x = title.x + title.getBounds().width * scale - viewBtnTxt.getBounds().width;
        viewBtnTxt.y = backBtnTxt.y;
        viewBtn.graphics.beginFill('#000').drawRect(0, 0, viewBtnTxt.getBounds().width * scale, (viewBtnTxt.getBounds().height + 10) * scale);
        viewBtn.x = viewBtnTxt.x;
        viewBtn.y = viewBtnTxt.y;
        viewBtn.alpha = 0.01;


        // 开始游戏按钮
        gameBtn = new cjs.Sprite(source.common, 'btn_begin');
        gameBtn.name = 'gameBtn';
        gameBtn.y = 200 / 650 * h;
        gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * scale >> 1;
        gameBtn.scaleX = gameBtn.scaleY = scale;

        // 开始游戏文本
        this.btnTxtCtn = new cjs.Container();

        gameBtnTxt = new cjs.Sprite(source.common, 'tip_gameStart');
        gameBtnTxt.name = 'countBtn';
        gameBtnTxt.scaleX = gameBtnTxt.scaleY = scale;

        bitmapText = new cjs.BitmapText('x9', source.indexfont);
        bitmapText.name = 'countTxt';
        bitmapText.x = gameBtnTxt.getBounds().width * scale;
        bitmapText.y = (gameBtnTxt.getBounds().height - bitmapText.getBounds().height) / 2 * scale;
        bitmapText.scaleX = bitmapText.scaleY = scale;

        this.btnTxtCtn.addChild(gameBtnTxt, bitmapText);

        this.btnTxtCtn.x = stage.canvas.width - gameBtnTxt.getBounds().width * scale * 1.1 >> 1;
        this.btnTxtCtn.y = gameBtn.y + (gameBtn.getBounds().height - gameBtnTxt.getBounds().height * 1.1 - 6) / 2 * scale;

        tip1 = new cjs.Text('游戏秘诀：获取更多游戏机会', 'bold ' + 34 * scale + 'px Heiti SC,Microsoft YaHei', '#fff');
        tip1.x = stage.canvas.width - tip1.getBounds().width >> 1;
        tip1.y = 290 / 650 * h;

        btnInvite = new cjs.Sprite(source.common, 'btn_invite');
        btnInvite.name = 'btnInvite';
        btnInvite.y = 320 / 650 * h;
        btnInvite.scaleX = btnInvite.scaleY = scale;

        btnInvest = new cjs.Sprite(source.common, 'btn_invest');
        btnInvest.name = 'btnInvest';
        btnInvest.y = btnInvite.y;
        btnInvest.scaleX = btnInvest.scaleY = scale;

        baseX = stage.canvas.width - scale * btnInvite.getBounds().width >> 1;
        moveDis = btnInvite.getBounds().width * scale / 2 + 20 * scale;
        btnInvite.x = baseX - moveDis;
        btnInvest.x = baseX + moveDis;

        html = document.getElementById('record-panel');
        html.style.display = 'block';
        html.style.fontSize = 24 * scale + 'px';
        htmlEl = new cjs.DOMElement(html);
        if (bg.x < 0) {
            html.style.width = w + 'px';
            htmlEl.x = 0;
        } else {
            html.style.width = bg.getBounds().width * scale + 'px';
            htmlEl.x = bg.x;
        }

        htmlEl.y = 380 / 650 * h;

        this.ctnWidth = bg.getBounds().width;
        this.ctn.addChild(bg, title, gameOut, backBtnTxt, backBtn, viewBtnTxt, viewBtn, gameBtn, this.btnTxtCtn, tip1, btnInvite, btnInvest, htmlEl);

        this._addEvent();

        stage.addChild(this.ctn);
        stage.update();
    };

    this.show = function() {
        var self = this;
        util.getInitDataB(function(data) {
            config.code = data.content.myCode;
            config.inviteFriend = data.content.shareRegisterCount;
            config.affectFriend = data.content.registerInvestCount;
            config.isLogin = data.content.isLogin;
            config.leftChance = data.content.chanceCout;

            util.setInvite();
            util.shareActivity('invite');
            self._updateView();
        });

        this.ctn.visible = true;
        this._updateView();
    };

    this._updateView = function() {
        var btn = this.btnTxtCtn.getChildByName('countBtn'),
            txt = this.btnTxtCtn.getChildByName('countTxt'),
            gameBtn = this.ctn.getChildByName('gameBtn'),
            title = this.ctn.getChildByName('title'),
            gameOut = this.ctn.getChildByName('gameOut'),
            viewBtn = this.ctn.getChildByName('viewBtn'),
            backBtn = this.ctn.getChildByName('backBtn');

        if (config.leftChance === 0) {
            gameBtn.gotoAndPlay('btn_gray');
            txt.text = '';
            title.visible = 0;
            gameOut.visible = true;
            viewBtn.y = gameOut.y + gameOut.getBounds().height * this.scale * 0.8 + 10 * this.scale;
            backBtn.y = viewBtn.y;
            this.btnTxtCtn.visible = false;
        } else {
            gameBtn.gotoAndPlay('btn_begin');
            txt.text = 'x' + config.leftChance;
            this.btnTxtCtn.x = stage.canvas.width - (txt.getBounds().width + btn.getBounds().width) * scale >> 1;
            this.btnTxtCtn.visible = true;
            title.visible = true;
            gameOut.visible = 0;
            viewBtn.y = title.y + title.getBounds().height * this.scale + 10 * this.scale;
            backBtn.y = viewBtn.y;
            if (config.leftChance >= 10) {
                gameBtn.scaleX = this.scale + 0.2;
                gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * gameBtn.scaleX >> 1;
            } else {
                gameBtn.scaleX = this.scale;
                gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * gameBtn.scaleX >> 1;
            }
        }

        stage.update();

    };

    this._addEvent = function() {
        var self = this;

        this.ctn.getChildByName('gameBtn').on('click', function() {
            if (config.leftChance <= 0) {
                return;
            }

            self.screenOut();
            iceGame.show();
            iceGame.gameRestart();
        });

        this.ctn.getChildByName('viewBtn').on('click', function() {
            if (config.isApp && config.appVersion >= 241) {
                window.appJsBridge.gotoView('myYcode');
            } else {
                location.href = '/h5/#/myYcode';
            }
        });

        this.ctn.getChildByName('backBtn').on('click', function() {
            self.screenOut();
            intro.show();
        });

        this.ctn.getChildByName('btnInvite').on('click', function() {
            if (config.isWexin) {
                util.showShareMsk();
            } else if (config.isApp && config.appVersion >= 241) {
                window.appJsBridge.gotoView('inviteFriend');
            } else {
                dialog.showInvite();
            }
        });

        this.ctn.getChildByName('btnInvest').on('click', function() {
            if (config.isApp) {
                window.appJsBridge.gotoView('investList');
            } else {
                location.href = '/h5/#/financing';
            }
        });

    };

    this.screenOut = function() {
        util.shareActivity();
        this.ctn.visible = false;
        stage.update();
    };

    this._init();
}

/**
 * 活动介绍页 index
 */
function IntroScreen() {
    this.ctn = null;
    this.isShow = false;
    this.scale = 1;
    this._init = function() {
        var container = new cjs.Container(),
            bg, scale, title, bounds,
            gameBtn, gameBtnTxt, bitmapText,
            recordBtn, recordBtnBounds,
            ruleBtn, ruleBtnBounds, ruleDlg;

        this.ctn = container;
        container.visible = true;

        // 填充背景
        bg = new cjs.Bitmap(source.getResult('intro_bg'));
        this.scale = util.resetBgPos(bg);
        scale = this.scale;

        // 标题
        title = new cjs.Sprite(source.common, 'tip_title');
        bounds = title.getBounds();
        title.x = stage.canvas.width - bounds.width * scale >> 1;
        title.y = 45 / 650 * h;
        title.scaleX = title.scaleY = scale;

        // 开始游戏按钮
        gameBtn = new cjs.Sprite(source.common, 'btn_begin');
        gameBtn.name = 'gameBtn';
        gameBtn.y = 250 / 650 * h;
        gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * scale >> 1;
        gameBtn.scaleX = gameBtn.scaleY = scale;

        // 开始游戏文本
        this.btnTxtCtn = new cjs.Container();

        gameBtnTxt = new cjs.Sprite(source.common, 'tip_gameStart');
        gameBtnTxt.name = 'countBtn';
        gameBtnTxt.scaleX = gameBtnTxt.scaleY = scale;

        bitmapText = new cjs.BitmapText('x9', source.indexfont);
        bitmapText.name = 'countTxt';
        bitmapText.x = gameBtnTxt.getBounds().width * scale;
        bitmapText.y = (gameBtnTxt.getBounds().height - bitmapText.getBounds().height) / 2 * scale;
        bitmapText.scaleX = bitmapText.scaleY = scale;

        this.btnTxtCtn.addChild(gameBtnTxt, bitmapText);

        this.btnTxtCtn.x = stage.canvas.width - gameBtnTxt.getBounds().width * scale * 1.1 >> 1;
        this.btnTxtCtn.y = gameBtn.y + (gameBtn.getBounds().height - gameBtnTxt.getBounds().height * 1.1 - 6) / 2 * scale;

        recordBtn = new cjs.Sprite(source.common, 'flag_record');
        recordBtnBounds = recordBtn.getBounds();
        recordBtn.name = 'recordBtn';
        recordBtn.y = 350 / 650 * h;
        recordBtn.x = 420 * scale + stage.canvas.width - recordBtnBounds.width * scale >> 1;
        recordBtn.scaleX = recordBtn.scaleY = scale;

        ruleBtn = new cjs.Sprite(source.common, 'rule');
        ruleBtnBounds = ruleBtn.getBounds();
        ruleBtn.name = 'ruleBtn';
        ruleBtn.y = stage.canvas.height - (ruleBtnBounds.height + 20) * scale;
        ruleBtn.x = stage.canvas.width - ruleBtnBounds.width * scale >> 1;
        ruleBtn.scaleX = ruleBtn.scaleY = scale;

        ruleDlg = this._addRuleMsk();
        ruleDlg.name = 'rule';
        this.ruleDlg = ruleDlg;

        container.addChild(bg, title, gameBtn, this.btnTxtCtn, recordBtn, ruleBtn, ruleDlg);

        stage.addChild(container);
        this._addEvent();
        this.show();
    };

    this._addRuleMsk = function() {
        var ruleDlg = new cjs.Container(),
            mask, dialog, title, html, htmlEl, btnIknow;

        ruleDlg.visible = false;
        mask = new cjs.Shape();
        mask.graphics.beginFill('#000').drawRect(0, 0, w, h);
        mask.alpha = 0.8;

        dialog = new cjs.Sprite(source.common, 'dialog_big');
        dialog.scaleX = dialog.scaleY = this.scale;
        dialog.x = stage.canvas.width - dialog.getBounds().width * this.scale >> 1;
        dialog.y = stage.canvas.height - dialog.getBounds().height * this.scale >> 1;

        title = new cjs.Sprite(source.common, 'rule_title');
        title.scaleX = title.scaleY = this.scale;
        title.x = stage.canvas.width - title.getBounds().width * this.scale >> 1;
        title.y = dialog.y + 60 * this.scale;

        btnIknow = new cjs.Sprite(source.common, 'btn_iknow');
        btnIknow.name = 'btnIknow';
        btnIknow.scaleX = btnIknow.scaleY = this.scale;
        btnIknow.x = stage.canvas.width - btnIknow.getBounds().width * this.scale >> 1;
        btnIknow.y = dialog.y + (dialog.getBounds().height - btnIknow.getBounds().height - 60) * this.scale;

        html = document.getElementById('activity-rule');
        html.style.display = 'block';
        html.style.fontSize = 24 * scale + 'px';
        htmlEl = new cjs.DOMElement(html);
        htmlEl.y = title.y + (title.getBounds().height + 20) * this.scale;
        htmlEl.x = dialog.x + 60 * this.scale;
        html.style.width = dialog.getBounds().width * scale - 120 * this.scale + 'px';
        html.style.height = btnIknow.y - htmlEl.y - 20 + 'px';

        ruleDlg.addChild(mask, dialog, title, htmlEl, btnIknow);

        return ruleDlg;
    };

    this._addEvent = function() {
        var self = this,
            html = document.getElementById('activity-rule');

        this.ctn.getChildByName('gameBtn').on('click', function() {
            if (!config.isLogin) {
                dialog.unLogin();
                return;
            }

            if (config.leftChance <= 0) {
                dialog.outOfChance();
                return;
            }

            self.screenOut();
            iceGame.show();
            iceGame.gameRestart();
        });

        this.ctn.getChildByName('recordBtn').on('click', function() {
            if (!config.isLogin) {
                dialog.unLogin();
                return;
            }

            self.screenOut();
            recordS.show();
        });

        this.ctn.getChildByName('ruleBtn').on('click', function() {
            self.ruleDlg.visible = true;
            html.classList.add('show');
            stage.update();
        });

        this.ruleDlg.getChildByName('btnIknow').on('click', function() {
            self.ruleDlg.visible = false;
            html.classList.remove('show');
            stage.update();
        });

        this.ruleDlg.addEventListener('click', function() { }, false);
    };

    this.screenOut = function() {
        this.ctn.visible = false;
        stage.update();
    };

    this.show = function() {
        // cjs.Tween.get(this.ctn).to({
        //     alpha: 0, visible: true
        // }, 0).to({
        //     alpha: 1
        // }, 1000);
        this.ctn.visible = true;

        var btn = this.btnTxtCtn.getChildByName('countBtn'),
            txt = this.btnTxtCtn.getChildByName('countTxt'),
            gameBtn = this.ctn.getChildByName('gameBtn');

        if (config.leftChance == 0) {
            txt.text = '';
            btn.scaleX = btn.scaleY = this.scale * 1.1;
            this.btnTxtCtn.x = stage.canvas.width - btn.getBounds().width * scale * 1.1 >> 1;
            this.btnTxtCtn.y = gameBtn.y + (gameBtn.getBounds().height - btn.getBounds().height * 1.1 - 6) / 2 * scale;
        } else {
            txt.text = 'x' + config.leftChance;
            btn.scaleX = btn.scaleY = this.scale;
            this.btnTxtCtn.x = stage.canvas.width - (txt.getBounds().width + btn.getBounds().width) * scale >> 1;
            this.btnTxtCtn.y = gameBtn.y + (gameBtn.getBounds().height - btn.getBounds().height - 6) / 2 * scale;
            if (config.leftChance >= 10) {
                gameBtn.scaleX = this.scale + 0.2;
                gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * gameBtn.scaleX >> 1;
            } else {
                gameBtn.scaleX = this.scale;
                gameBtn.x = stage.canvas.width - gameBtn.getBounds().width * gameBtn.scaleX >> 1;
            }
        }

        stage.update();
    };

    this._init();
}


/**
 * 游戏音乐
 */
function GameMusice() {

    this.play = function(id, option) {
        option = option || {};
        if (!config.playAudio) {
            return;
        }

        cjs.Sound.play(id, {
            interrupt: config.playAudio, loop: option.loop ? -1 : 0, offset: option.offset || 0, delay: option.delay || 0
        });
    };

    this.on = function() {
        cjs.Sound.setVolume(1);
    };

    this.off = function() {
        cjs.Sound.setVolume(0);
    };

    this.play('bgm', {
        loop: true,
        volume: 0.8
    });
}


/**
 * 弹窗
 */
function Dialog() {
    this.ctn = null;
    this.content = null;

    this._init = function() {
        var container = new cjs.Container(),
            mask,
            dialogForm,
            closeBtn,
            btnLogin,
            dlgMsg,
            txt,
            btnOk,
            btnGo,
            btnNo;

        this.ctn = container;
        container.visible = false;

        mask = new cjs.Shape();
        mask.graphics.beginFill('#000').drawRect(0, 0, w, h);
        mask.alpha = 0.7;

        dialogForm = new cjs.Sprite(source.common, 'dialog');
        dialogForm.name = 'dialog';
        dialogForm.scaleX = dialogForm.scaleY = scale;
        dialogForm.x = stage.canvas.width - scale * dialogForm.getBounds().width >> 1;
        dialogForm.y = stage.canvas.height - scale * dialogForm.getBounds().height >> 1;

        closeBtn = new cjs.Sprite(source.common, 'dialog_close');
        closeBtn.name = 'close';
        closeBtn.scaleY = closeBtn.scaleX = scale;
        closeBtn.y = dialogForm.y - 6 * scale;
        closeBtn.x = dialogForm.x + dialogForm.getBounds().width * scale - (closeBtn.getBounds().width) * scale;

        btnLogin = new cjs.Sprite(source.common, 'btn_login');
        btnLogin.visible = 0;
        btnLogin.name = 'btnLogin';
        btnLogin.scaleX = btnLogin.scaleY = scale;
        btnLogin.y = dialogForm.getBounds().height * scale + dialogForm.y - btnLogin.getBounds().height * scale - 50 * scale;
        btnLogin.x = stage.canvas.width - scale * btnLogin.getBounds().width >> 1;

        dlgMsg = document.getElementById('dislog_msg');
        this.content = dlgMsg;
        dlgMsg.style.display = 'block';
        dlgMsg.innerText = '';
        dlgMsg.style.width = (dialogForm.getBounds().width - 100) * scale + 'px';
        dlgMsg.style.height = btnLogin.y - dialogForm.y - 160 * scale + 'px';
        dlgMsg.style.fontSize = 36 * scale + 'px';
        dlgMsg.style.color = '#fff';

        txt = new cjs.DOMElement(dlgMsg);
        txt.x = dialogForm.x + 60 * scale;
        txt.y = dialogForm.y + 120 * scale;

        btnOk = new cjs.Sprite(source.common, 'btn_ok');
        btnOk.visible = 0;
        btnOk.name = 'btnOk';
        btnOk.scaleX = btnOk.scaleY = scale;
        btnOk.y = btnLogin.y;
        btnOk.x = stage.canvas.width - scale * btnOk.getBounds().width >> 1;

        btnGo = new cjs.Sprite(source.common, 'btn_go');
        btnGo.visible = 0;
        btnGo.name = 'btnGo';
        btnGo.scaleX = btnGo.scaleY = scale;
        btnGo.y = btnLogin.y;
        btnGo.x = btnLogin.x + btnGo.getBounds().width * scale / 2 + 15 * scale;

        btnNo = new cjs.Sprite(source.common, 'btn_no');
        btnNo.visible = 0;
        btnNo.name = 'btnNo';
        btnNo.scaleX = btnNo.scaleY = scale;
        btnNo.y = btnLogin.y;
        btnNo.x = btnLogin.x - btnGo.getBounds().width * scale / 2 - 15 * scale;

        this.ctn.addChild(mask, dialogForm, closeBtn, txt, btnLogin, btnOk, btnGo, btnNo);
        this._addEvent();
        stage.addChild(this.ctn);
    };

    this._addEvent = function() {
        var self = this,
            dlgMsg = document.getElementById('dislog_msg');

        function closeDlg() {
            self.ctn.visible = false;
            dlgMsg.classList.remove('show');
            stage.update();
        }

        this.ctn.getChildByName('close').on('click', function() {
            closeDlg();
        });

        this.ctn.getChildByName('btnOk').on('click', function() {
            closeDlg();
        });

        this.ctn.getChildByName('btnNo').on('click', function() {
            closeDlg();
        });

        this.ctn.getChildByName('btnLogin').on('click', function() {
            // console.log('去登陆');
            if (config.isApp) {
                try {
                    window.appJsBridge.callHandler('reLogin_none');
                } catch (e) {
                    window.appJsBridge.callHandler('reLogin', '请先进行登录');
                }
            } else {
                location.href = '/h5/index.html#/login?href=' + location.href;
            }
        });

        this.ctn.getChildByName('btnGo').on('click', function() {
            closeDlg();
            intro.screenOut();
            recordS.show();
        });

        this.ctn.addEventListener('click', function() { }, false);
    };

    this.setContent = function(txt) {
        this.content.innerHTML = txt || '';
    };

    this.setBtnVisible = function() {
        this.ctn.getChildByName('btnOk').visible = false;
        this.ctn.getChildByName('btnNo').visible = false;
        this.ctn.getChildByName('btnLogin').visible = false;
        this.ctn.getChildByName('btnGo').visible = false;
    };

    this.outOfChance = function() {
        // 游戏次数不足
        var dlgMsg = document.getElementById('dislog_msg');

        this.ctn.visible = true;
        dlgMsg.classList.add('show');
        this.setContent('游戏次数用完咯~ <br> 快去获取更多游戏次数吧~');
        this.setBtnVisible();
        this.ctn.getChildByName('btnGo').visible = true;
        this.ctn.getChildByName('btnNo').visible = true;
        stage.update();
    };

    this.unLogin = function() {
        // 未登录
        var dlgMsg = document.getElementById('dislog_msg');

        this.ctn.visible = true;
        dlgMsg.classList.add('show');
        this.setBtnVisible();
        this.setContent('亲爱的金主，<br>您还没有登录哦~');
        this.ctn.getChildByName('btnLogin').visible = true;
    };

    this.netWorkExc = function() {
        // 网络异常
        this.showError('您的网络好像有点问题，<br>请检查网络后再试一下');
    };

    this.showError = function(msg) {
        // 普通信息
        var dlgMsg = document.getElementById('dislog_msg');

        this.ctn.visible = true;
        dlgMsg.classList.add('show');
        this.setBtnVisible();
        this.setContent(msg);
        this.ctn.getChildByName('btnOk').visible = true;
    };

    this._initInvite = function() {
        if (this._isInviteInit) {
            return;
        }

        var dlg = this.ctn.getChildByName('dialog'),
            dlgClose = this.ctn.getChildByName('close'),
            btnOk = this.ctn.getChildByName('btnOk'),
            dlgMsk = document.getElementById('invite_mask'),
            ctn = dlgMsk.querySelector('.invite_ctn'),
            closeBtn = dlgMsk.querySelector('.invite_ctn-close'),
            finshBtn = dlgMsk.querySelector('.invite_ctn-finsh'),
            title = dlgMsk.querySelector('.invite_ctn-title'),
            input = dlgMsk.querySelector('.invite_ctn-input '),
            frame2,
            frame11,
            frame13;

        frame11 = source.common.getFrame(11);
        ctn.style.top = dlg.y + 'px';
        ctn.style.left = dlg.x + 'px';
        ctn.style.width = frame11.rect.width * scale + 'px';
        ctn.style.height = frame11.rect.height * scale + 'px';
        ctn.style.backgroundPositionX = -frame11.rect.x + 'px';
        ctn.style.backgroundPositionY = -frame11.rect.y * scale + 'px';
        ctn.style.backgroundSize = frame11.image.width * scale + 'px';

        frame13 = source.common.getFrame(13);
        closeBtn.style.top = dlgClose.y - dlg.y + 'px';
        closeBtn.style.left = dlgClose.x - dlg.x + 'px';
        closeBtn.style.width = frame13.rect.width * scale + 'px';
        closeBtn.style.height = frame13.rect.height * scale + 'px';
        closeBtn.style.backgroundPositionX = -frame13.rect.x * scale + 'px';
        closeBtn.style.backgroundPositionY = -frame13.rect.y * scale + 'px';
        closeBtn.style.backgroundSize = ctn.style.backgroundSize;

        frame2 = source.common.getFrame(2);
        finshBtn.style.top = btnOk.y - dlg.y + 'px';
        finshBtn.style.left = btnOk.x - dlg.x + 'px';
        finshBtn.style.width = frame2.rect.width * scale + 'px';
        finshBtn.style.height = frame2.rect.height * scale + 'px';
        finshBtn.style.backgroundPositionX = -frame2.rect.x * scale + 'px';
        finshBtn.style.backgroundPositionY = -frame2.rect.y * scale + 'px';
        finshBtn.style.backgroundSize = ctn.style.backgroundSize;

        title.style.marginTop = 60 * scale + 'px';
        title.style.fontSize = 34 * scale + 'px';

        input.style.fontSize = 30 * scale + 'px';
        input.style.marginTop = 20 * scale + 'px';
        input.style.height = btnOk.y - dlg.y - 140 * scale - title.clientHeight + 'px';

        closeBtn.addEventListener('click', function() {
            dlgMsk.style.display = 'none';
        });

        finshBtn.addEventListener('click', function() {
            dlgMsk.style.display = 'none';
        });

        this._isInviteInit = true;
    };

    this.showInvite = function() {
        this._initInvite();

        var dlgMsk = document.getElementById('invite_mask'),
            input = dlgMsk.querySelector('.invite_ctn-input');

        dlgMsk.style.display = 'block';
        input.value = '我真的赚翻了~拼手速的时刻你准备好了么？' + location.protocol + '//' + location.host + '/h5/activity/appRegister.html?code=' + config.code;
    };

    this._init();
}

function getGameStatus(callback) {
    var config = {
        status: 'success',
        content: {
            isLogin: true,
            chanceCout: 3,
            shareRegisterCount: 2,// 邀请好友
            registerInvestCount: 0 // 有效好友数目
        }
    };

    // var gameInit = source.getResult('gameInit') || {
    //     content: {}
    // },
    //     config = JSON.parse(gameInit);

    if (callback) {
        callback(config);
    }
}
/**
 * 初始化游戏
 */
function initGameCore() {
    var gameStatus;

    stage = new cjs.Stage('canvas');
    w = window.innerWidth;
    h = window.innerHeight;
    cjs.Touch.enable(stage);
    canvas = document.getElementById('canvas');
    canvas.height = h;
    canvas.width = w;
    scale = 1;

    intro = new IntroScreen();
    iceGame = new IceGame({
        time: 10,
        leastHit: 60
    });
    recordS = new RecordScreen();
    music = new GameMusice();
    dialog = new Dialog();
    util.shareActivity();
    getGameStatus(function(res) {

        config.isLogin = res.content.isLogin;
        config.activityStatus = res.content.activityStatus;
        config.leftChance = res.content.chanceCout || 0;
        config.affectFriend = res.content.shareRegisterCount || 0;
        config.inviteFriend = res.content.registerInvestCount || 0;

        if (res.status !== 'success') {
            dialog.showError(gameStatus.msg || '网络异常,请稍后重试');
            return;
        }

        intro.show();
    });
}

source = new Resource();
source.loadResource(initGameCore);
