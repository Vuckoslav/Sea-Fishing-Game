window.onload = main;

function main() {
    const canvas = document.querySelector('canvas')
    const c = canvas.getContext('2d')
    
    const gunElements = document.querySelectorAll('.gun');
    const targetElement = document.querySelector('.target');
    const bulletElement = document.querySelector('.bullet');
    const fishElements = document.querySelectorAll('.fish');
    const fish1Elements = document.querySelectorAll('.fish1');
    const bombElement = document.querySelector('.bomb');
    const alienElement = document.querySelector('.alien');
    const sunElement = document.querySelector('.sun');
    const heartElement = document.querySelector('.heart');
    const pearlElement = document.querySelector('.pearl'); 
    const candyElements = document.querySelectorAll('.candy'); 
    const beerElement = document.querySelector('.beer');
    const gameOverBtn = document.querySelector('.gameOverBtn');
    
    
    const audioFile1 = 'fishImage/hit.mp3';
    const audio1 = new Audio(audioFile1);
    audio1.playbackRate = 10;
    
    canvas.width = innerWidth
    canvas.height = innerHeight -2;  //offset  mobile
    
    let startTime;
    let elapsedStr;
    let firedBullets = 0;
    let hits = 0;
    let misses = 0;
    
    let gameEnd = false;
    
    let DEBUG
    // DEBUG = true; 
    
    const TO_RADIANS = Math.PI/180;
    
    var angle=0;
    var da =1;
    
    const mouse = {
        x: innerWidth / 2,
        y: innerHeight / 2
    }
    
    const colors = {
        blue:'#2D95BF', // blue
        green:'#4EBA6F', // green
        orange:'#F0C419', // orange
        red:'#F15A5A', // red
        purple:'#955BA5' // purple
    };
    
    // Event Listeners
    addEventListener('mousemove', event => {
        mouse.x = event.clientX
        mouse.y = event.clientY
    });
    
    addEventListener("touchmove", function(e) {
        mouse.x = e.changedTouches[0].clientX;
        mouse.y = e.changedTouches[0].clientY;
    });   
        
    addEventListener('resize', () => {
        canvas.width = innerWidth
        canvas.height = innerHeight
    
        init()
    });
    
    addEventListener('click', () => {
        if(selectWeapon.show) selectWeapon.select();
        else if(!gameEnd) fireBullet();
    });  
    
    
    // Wave
    function Wave(y, height, color, speed) {
        this.y = y
        this.height = height;
        this.color = color
        this.x = -1 * innerWidth;
        this.speed = speed;
        
        this.halfCycle = innerWidth/4; 
    }
    
    Wave.prototype.draw = function() {
        c.beginPath();
        c.moveTo(this.x, this.y);
        c.quadraticCurveTo(this.x + this.halfCycle, this.y - this.height , this.x + this.halfCycle * 2, this.y);
        c.quadraticCurveTo(this.x + this.halfCycle*3, this.y + this.height , this.x + this.halfCycle * 4, this.y);
        c.quadraticCurveTo(this.x + this.halfCycle*5, this.y - this.height , this.x + this.halfCycle * 6, this.y);
        c.quadraticCurveTo(this.x + this.halfCycle*7, this.y + this.height , this.x + this.halfCycle * 8, this.y);
        c.lineTo(innerWidth, innerHeight+15);
        c.lineTo(0, innerHeight+10);
        c.fillStyle = this.color;
        c.fill();
        c.strokeStyle = "#888888"
        c.stroke();
        c.closePath()
    }
    
    Wave.prototype.update = function() {
        // this.height = rand(20, 22);
        this.x += this.speed;
        if(this.x>0) this.x = -1 * innerWidth;        
        
        this.draw()
    }
    
    
    // Objects
    function Bullet(img, x, y, width, height) {
        this.img = img;
        this.x = x
        this.y = y
        this.width = width
        this.height = height;
        
        let selectedGun = selectWeapon.selected.item;
        if(selectedGun.classList.contains('gun1')) this.speed = 8;
        else if(selectedGun.classList.contains('gun2')) this.speed =10;  // faster bullet speed for gun2
        else this.speed = 20;
        
        this.nextPoint = nextPointsPath({x: this.x, y: this.y}, {x:mouse.x, y:mouse.y});
        this.angle = null;
        this.show = true;
    }
    
    Bullet.prototype.draw = function() {
        drawImageRotate(this.img, this.x, this.y, this.width, this.height, this.angle)
    }
    
    Bullet.prototype.update = function() {
        if(this.x > innerWidth || this.y > innerHeight) return;
        if(!this.show) return;
        
        if(this.angle === null) this.angle = getPointsAngle(mouse, {x: this.x, y: this.y});
        this.x += this.nextPoint.x * this.speed;
        this.y += this.nextPoint.y * this.speed;
        
        // console.log('this.nextPoint.x: ' + this.nextPoint.x + 'this.nextPoint.y: ' + this.nextPoint.y)
        
        this.draw()
    }
    
    Bullet.prototype.getPara = function() {
        return {x:this.x, y:this.y, width:this.width, height:this.height, show:this.show};
    }
    
    Bullet.prototype.disable = function() {
        this.show = false;
    }    
    
 // Gun
    function Gun(img, x, y, width, height) {
        this.img = img;
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.angle = 90;  
    }
    
    Gun.prototype.draw = function() {
        drawImageRotate(this.img, this.x, this.y, this.width, this.height, this.angle);
        // console.log('angle: ' + this.angle)
    }
    
    Gun.prototype.update = function() {
        this.angle = getPointsAngle(mouse, {x: this.x, y: this.y});
        this.draw()
    }  
    
    
    function flipHorizontally(around) {
        c.translate(around, 0);
        c.scale(-1, 1);
        c.translate(-around, 0);
    }
    
 // Fish
    function Fish(img, width, height, due) {
        this.img = img;
        this.x = -30;
        this.y = rand(0.13*innerHeight, 0.9*innerHeight);
        this.width = width
        this.height = height
        this.show = true;
        this.fliph;
        this.swimPoint1 = {};
        this.swimPoint2 = {};        

        this.nextPoint = {};
        this.speed = 0.5 + Math.random();
        this.swimSetup(this.x, this.y);
        
        this.due = due;
    }
    
    Fish.prototype.swimSetup = function(x, y) {
        this.fliph = Math.floor(Math.random()*2);
        this.swimPoint1.x = x;
        this.swimPoint1.y = y;
        this.swimPoint2.x = innerWidth + 30;
        this.swimPoint2.y = rand(0.12*innerHeight, 0.95*innerHeight);        

        if(this.fliph) {
            this.nextPoint = nextPointsPath(this.swimPoint1, this.swimPoint2);
            this.x = this.swimPoint1.x;
            this.y = this.swimPoint1.y;
        }
        else {
            this.nextPoint = nextPointsPath(this.swimPoint2, this.swimPoint1);
            this.x = this.swimPoint2.x;
            this.y = this.swimPoint2.y;            
        }
    }
    
    Fish.prototype.draw = function() {
        c.save();
        if(this.fliph) flipHorizontally(this.x + 10);
        
        // c.globalAlpha = 0.5
        c.drawImage(this.img, this.x, this.y, this.width, this.height);
        c.restore();
    }
    
    Fish.prototype.update = function() {
        if(this.due-- < 0) {
            if(this.show) {
                this.x += this.nextPoint.x*this.speed;
                this.y += this.nextPoint.y*this.speed;
                this.draw()
            }
        }
    } 
    
    Fish.prototype.getPara = function() {
        return {x:this.x, y:this.y, width:this.width, height:this.height, show:this.show};
    }
    
    Fish.prototype.disable = function() {
        this.show = false;
    }
    
     // Bomb
    function Candy(img, width, height, due) {
        this.img = img;
        this.width = width
        this.height = height
        this.rotate = 0;
        this.show = true;
        this.dt = Math.random()>0.5? 1 : -1; 
        
        this.x = rand(0.03*innerHeight, 0.96*innerHeight);
        this.y = 0.12*innerHeight;    
        this.speed = 1;
        this.due = due;
    }
    
    Candy.prototype.draw = function() {
        this.y += this.speed
       drawImageRotate(this.img, this.x, this.y, this.width*0.8, this.height*0.8, this.rotate*TO_RADIANS);
       this.rotate = this.rotate<360 ? this.rotate+this.dt: 0;
        // console.log('angle: ' + this.angle)
    }
    
    Candy.prototype.update = function() {
        if(this.due-- < 0) {
            if(this.show) this.draw()
        }
        // console.log(this.due)
    } 
    
    Candy.prototype.getPara = function() {
        return {x:this.x, y:this.y, width:this.width, height:this.height, show:this.show};
    }
    
    Candy.prototype.disable = function() {
        this.show = false;
    }
    
    
     // Bomb
    function Bomb(img, x, y, width, height) {
        this.img = img;
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.rotate = 0;
        this.show = true;
        this.dt = Math.random()>0.5? 1 : -1;
        
        this.x = rand(0.03*innerHeight, 0.96*innerHeight);
        this.y = -30;    
        this.speed = 1;
    }
    
    Bomb.prototype.draw = function() {
        this.y += this.speed
       drawImageRotate(this.img, this.x, this.y, this.width, this.height, this.rotate*TO_RADIANS);
       this.rotate = this.rotate<360 ? this.rotate+this.dt: 0;
        // console.log('angle: ' + this.angle)
    }
    
    Bomb.prototype.update = function() {
        if(this.show) this.draw()
    } 
    
    Bomb.prototype.getPara = function() {
        return {x:this.x, y:this.y, width:this.width, height:this.height, show:this.show};
    }
    
    Bomb.prototype.disable = function() {
        this.show = false;
    }
    
     // Bonus
    function Bonus(num, x, y, color) {
        this.num = num;
        this.x = x
        this.y = y
        this.color = color
        this.timeoutInit = 80
        this.timeout = this.timeoutInit
        this.text
        this.show = true;
        
        score.increment(this.num);
    }
    
    Bonus.prototype.draw = function() {
        c.font = "1em Comic Sans MS";
        c.fillStyle = this.color;
        c.textAlign = "center";
        c.fillText(this.text, this.x + 30, this.y + 40);
        
    }
    
    Bonus.prototype.update = function() {
        if(this.num > 0) this.text = '+' + this.num;
        else this.text = +this.num;
        if(this.timeout-->0) {
            c.save();
            c.globalAlpha = this.timeout/this.timeoutInit;
            this.draw();
            c.restore();
        }
        else this.show = false;
    } 
    
     
     // Damage
    function Life(num, x, y, color) {
        this.num = num;
        this.x = x
        this.y = y
        this.color = color
        this.timeoutInit = 80;
        this.timeout = this.timeoutInit;
        this.text
        
        health.increment(this.num);
    }
    
    Life.prototype.draw = function() {
        c.font = "25px Comic Sans MS";
        c.fillStyle = this.color;
        c.textAlign = "center";
        c.fillText(this.text, this.x + 30, this.y + 40);
    }
    
    Life.prototype.update = function() {
        if(this.num > 0) this.text = '+' + this.num;
        else this.text = +this.num;
        if(this.timeout-->0) {
            c.save();
            c.globalAlpha = this.timeout/this.timeoutInit;
            this.draw();
            c.restore();
        }
    }  
    
    
     // Score
    function Score(num, x, y, color) {
        this.num = num;
        this.x = x
        this.y = y
        this.color = color      
    }
    
    
    Score.prototype.draw = function() {
        c.font = 0.05*innerWidth + "px Comic Sans MS";
        c.fillStyle = this.color;
        c.textAlign = "left";
        
        
        c.fillText(this.num, this.x, this.y);
        c.drawImage(beerElement, 0.72*innerWidth, this.y - 0.04*innerWidth, 0.05*innerWidth, 0.05*innerWidth);
    }
    
    Score.prototype.update = function() {
        this.draw()
    }    
    
    Score.prototype.increment = function(n) {
        this.num += n;
        this.update();
    }
         
    
    // Health
    function Health(num, x, y, color) {
        this.num = num;
        this.x = x
        this.y = y
        this.color = color      
    }      
    
    Health.prototype.draw = function() {
        c.font = 0.05*innerWidth + "px Comic Sans MS";
        c.fillStyle = this.color;
        c.textAlign = "left";
        c.fillText(this.num, this.x, this.y);
        c.drawImage(heartElement, 0.01*innerWidth, this.y - 0.04*innerWidth, 0.05*innerWidth, 0.05*innerWidth);
    }
    
    Health.prototype.update = function() {
        this.draw()
    }    
    
    Health.prototype.increment = function(n) {
        this.num += n;
        // this.update();
    }       
    
    function GeneratorFish(interval, batch) { 
        this.interval = interval;
        this.batch = batch;
        this.count = this.interval; 
    }
    
    GeneratorFish.prototype.update = function(ele) {
        if(this.count++>this.interval) {
            this.create(ele);
            this.count = 0; 
        }
    }
    
    GeneratorFish.prototype.create = function(elements) {    
        for(let i=0;i<this.batch;i++) {
            let index = rand(0, elements.length-1);
            fishes.push(new Fish(elements[index], 32, 32, rand(0,this.interval)));  
            fishes[i].update();
        }         
    }
    
    function GeneratorCandy(interval, batch) { 
        this.interval = interval;
        this.batch = batch;
        this.count = this.interval; 
    }
    
    GeneratorCandy.prototype.update = function(ele) {
        if(this.count++>this.interval) {
            this.create(ele);
            this.count = 0; 
        }
    }
    
    GeneratorCandy.prototype.create = function(elements) {    
        for(let i=0;i<this.batch;i++) {
            let index = rand(0, elements.length-1);
            candies.push(new Candy(elements[index], 32, 32, rand(0,this.interval)));  
            candies[i].update();
        }         
    }    
    
    function SelectWeapon() {
        this.angle = 90;
        this.show = true;
        this.speed = 0.05;
        this.selected = {x:-10, y:-10, item:null} 
    }
    
    SelectWeapon.prototype.update = function() {
        w = innerWidth/4;
        h = innerHeight/4; 
        marginTop = 0.5*h;
        
        text = "Welcome! It's Fishing Season!"
        c.font = 0.07*innerHeight + "px " + "Comic Sans MS";
        c.fillStyle = colors.blue;
        c.textAlign = "center";
        c.fillText(text, innerWidth/2, marginTop, innerWidth);        
        
        this.angle += this.speed;
        if(this.angle>95 || this.angle<85) this.speed = -this.speed;

        for(let i=0;i<gunElements.length;i++) {
            let item = {};
            item.x = innerWidth/2;
            item.y =  w + i*h+marginTop;
            item.width = h;
            item.height = h;
            
            drawImageRotate(gunElements[i], item.x, item.y, item.width, item.height, this.angle*TO_RADIANS);
            if( isColision(item, this.selected, item.width/2, 2) ) {  // 5 - target width 
                this.selected.item = gunElements[i]; 
                this.show = false; 

                return;
            }
                // console.log('item: ' + item.x + ', ' + item.y);
                // console.log('select: ' + this.selected.x + ', ' + this.selected.y)   
                

            
        }
        
        text = 'Pick the Weapon'
        c.font = 0.05*innerHeight + "px " + "Comic Sans MS";
        c.fillStyle = colors.blue;
        c.textAlign = "center";
        text = 'Pick the Weapon';
        c.fillText(text, innerWidth/2, 3*h + marginTop, innerWidth);

       this.show = true;        
    }  
    
    SelectWeapon.prototype.select = function() {
        this.selected.x = mouse.x;
        this.selected.y = mouse.y;
    }
    
    // Implement
    let objects
    let selectWeapon;
    let wave;
    let score;
    let health;
    let gun;
    let candies = [];
    let bombs = [];
    let bullets = [];
    let fishes = [];
    let bonuses = [];
    let lifes = [];
    
    let generatorFish;
    let generatorFish1;
    let generatorCandy;
    
    
    function init() {
        wave = new Wave(0.11*innerHeight, 10, colors.blue, 2);
        selectWeapon = new SelectWeapon();
        score = new Score(0, 0.78*innerWidth, 0.05*innerWidth, colors.blue);
        
        let initHealthCount = 300;
        health = new Health(initHealthCount, 0.08*innerWidth, 0.05*innerWidth, colors.green); 
        
        // gun.update();
        
        generatorFish = new GeneratorFish(500, 20); 
        generatorFish1 = new GeneratorFish(500, 10); 
        generatorCandy = new GeneratorCandy(2000, 1); 
    }
    
    function RemoveIfUnusedItems(arr, i) {
        if(!arr[i].show || 
        arr[i].x > innerWidth + 100 || arr[i].x < -100 ||
        arr[i].y > innerHeight + 100 || arr[i].y < -100) {
            arr.splice(i, 1);
            return true;
        }
        return false
    }
    
    let start = true;
    function gameOver() {
        // c.save();
        
        if(start) {
            c.fillStyle = 'rgba(100,100,100,0.2)'; //#F0C419
            c.fillRect(0, 0, innerWidth, innerHeight);
            start = false;
        }
        
        c.drawImage(gameOverBtn, innerWidth/2 - 192/2, innerHeight/2 - 20, 192, 40);  //bm
    }
    
    function getElapsed(start, end) {
        let e = end - start;
        return Math.floor(e/1000);
        
    }

    
    // Animation 
    function animate() {
        let i,j;
        
        requestAnimationFrame(animate);
        
        if(!gameEnd) c.clearRect(0, 0, canvas.width, canvas.height);
        else {
            gameOver();
            
            
            return;
        }

        if(selectWeapon.show) {
            selectWeapon.update();
            c.drawImage(targetElement, mouse.x -16, mouse.y -16, 32, 32);
            if(DEBUG || 0) mouseGuide();                
            return;
        }
        
        if(startTime === undefined) {
            startTime = Date.now();
            elapsedStr = '00:00:00';
        }
        else elapsedStr = getElapsed(startTime, Date.now());
        
        let selectedGun = selectWeapon.selected.item;
        if(gun=== undefined) gun = new Gun(selectedGun, innerWidth/2, innerHeight - 30, 64, 64);
        
        drawCircle(0.14*innerWidth, 0.17*innerHeight, 0.2*innerHeight, '#333', 'HotPink'); // the Sun

        wave.update();
        gun.update();
        
        score.update();
        health.update();

        c.save();
        c.fillStyle = colors.orange;
        c.font = "1em 'Comic Sans MS'";
        
        c.fillText(`Hit:Miss: ${hits}:${misses}
        `, 0.01*innerWidth, innerHeight - 30)  
        
        c.fillText(`Elapsed: ${elapsedStr}
        `, 0.01*innerWidth, innerHeight - 10)  
        
        
        c.fillText(`Bullets: ${health.num}
        `, 0.6*innerWidth, innerHeight - 10);        

        c.restore();
        
        
       
        
        if(selectedGun.classList.contains('gun1')) generatorFish1.update(fish1Elements);
        else generatorFish.update(fishElements);
        
        generatorCandy.update(candyElements);
        
        for(i=0;i<fishes.length;i++) {
            if(!RemoveIfUnusedItems(fishes, i)) fishes[i].update();
        }
        
        for(i=0;i<candies.length;i++) {
            candies[i].update();
        }        
        
        for(i=0;i<bombs.length;i++) {
            bombs[i].update();
        }    
        
        for(i=0;i<bonuses.length;i++) {
            if(!RemoveIfUnusedItems(bonuses, i)) bonuses[i].update();
        }
        
        for(i=0;i<lifes.length;i++) {
            lifes[i].update();
        }        
        
        for(i=0; i<bullets.length; i++) {
            let show = bullets[i].show;
            if(!RemoveIfUnusedItems(bullets, i)) bullets[i].update();
            else if(show) { 
                
            }
        }


        
        for(i=0; i<bullets.length;i++) {
            if(colisionDetect(bullets[i], fishes, 50, colors.orange, 'bonus')) {
                hits++;
                misses = firedBullets - hits;
                return;
            }
            if(colisionDetect(bullets[i], candies, 100, colors.green, 'life')) {
                return;
            }            
            if(colisionDetect(bullets[i], bombs, -20, colors.red, 'life')) {
                return;
            }
            
        }
        
        c.drawImage(targetElement, mouse.x -16, mouse.y -16, 32, 32);
        if(DEBUG || 0) mouseGuide();   
        
        if(health.num<=0){    
            gameEnd = true;
        } 

    }
    
    function drawCircle(x, y, rad, strokecolor, fillcolor) {
        c.beginPath();
        c.strokeStyle = strokecolor;
        c.fillStyle = fillcolor;
        c.arc(x, y, rad, 0, 2*Math.PI);
        c.stroke();
        c.fill();
        c.closePath();
    }
    
    function mouseGuide() {
        c.fillStyle = '#aaa';
        c.save();
        c.font = 0.02*innerWidth + "px Comic Sans MS";
        c.fillText(` (${(mouse.x/innerWidth).toFixed(2)},${(mouse.y/innerHeight).toFixed(2)})`, mouse.x, mouse.y + 30)
        c.fillText(` (${(mouse.x/innerWidth).toFixed(2)},${(mouse.y/innerHeight).toFixed(2)})`, mouse.x - 60, mouse.y - 20)

        c.restore();        
    }
    
    function colisionDetect(item1, items2, score, scoreColor, scoreType) {
        for(var j=0; j<items2.length;j++) {
            let b = item1.getPara();
            let f = items2[j].getPara();
            
            if(!b.show || !f.show) continue;
            
            if(isColision({x: b.x+b.width/2, y: b.y+b.width/2}, {x: f.x+f.width/2, y: f.y+f.width/2}, b.width/2, f.width/2)) {
                if(scoreType === 'bonus') bonuses.push(new Bonus(score, f.x, f.y, scoreColor));
                else if(scoreType === 'life') lifes.push(new Life(score, f.x, f.y, scoreColor));

                items2[j].disable();
                item1.disable(); 
                return true;
            }
        }
        return false;
    }
    
    function fireBullet() {
        bullets.push(new Bullet(bulletElement, innerWidth/2, innerHeight - 30, 16, 16));
        health.increment(-1);
        firedBullets++;
        misses = firedBullets - hits;
        
        playAudio1()
        
    }
    
    function nextPointsPath(pointFrom, pointTo) {
        let tx = pointTo.x - pointFrom.x;
        let ty = pointTo.y - pointFrom.y;
        let dist = Math.sqrt(tx*tx+ty*ty);
        dx = tx/dist;
        dy = ty/dist;
        return {x: dx, y: dy};
    }
    
    function getPointsAngle(p1, p2) {
    
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }    
    
    function drawImageRotate(img, x,y, width, height, anglerad) {
        c.save();
        c.translate(x, y);
        
        c.rotate(anglerad);
        c.drawImage(img, -width/2, -height/2, width, height);
        c.restore();        
    }
    
    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }
    
    function randomColor(colors) {
        return colors[Math.floor(Math.random() * colors.length)]
    }
    
    function distance(point1, point2) {
        const xDist = point2.x - point1.x;
        const yDist = point2.y - point1.y;
    
        return Math.hypot(xDist, yDist); 
        
        
    }
    
    function isColision(point1, point2, radius1, radius2) {
        return distance(point1,point2) < radius1 + radius2;
    }   
    
    function playAudio1() {
        audio1.play();
    }
    
    init()
    animate()
    
    
}