
function Stars(width, height, count) {
    this.stars = [];
    for (var i = 0; i < count; i++) {
        this.stars.push({x: Math.random() * width, y: Math.random() * height});
    }
}

Stars.prototype.draw = function(ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.save();

    this.stars.forEach(function(star) {
        ctx.beginPath();
        ctx.fillRect(star.x, star.y, 1, 1);
        ctx.fill();
    });
    ctx.restore();
}

function Spaceship(x, y, radius) {
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.fill = '#0000FF';
    this.stroke = '#FFFFFF';
    this.movement = 0;
}

Spaceship.prototype.move = function(ctx, movement) {
    if (movement === 'left') {
        if (this.movement > -10) {
            this.movement -= 1;
        }
    } else if (movement === 'right') {
        if (this.movement < 10) {
            this.movement += 1;
        }
    } else if (movement === 'stop') {
        this.movement = 0;
    }

    let move = this.x + this.movement;
    if (move > ctx.canvas.width) {
        this.x = 0;
    } else if (move < 0) {
        this.x = ctx.canvas.width;
    } else {
        this.x = move;
    }
}

Spaceship.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.strokeStyle = this.stroke;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y + this.radius);
    ctx.lineTo(this.x - this.radius, this.y + this.radius);
    ctx.lineTo(this.x, this.y - this.radius);
    ctx.lineTo(this.x + this.radius, this.y + this.radius);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}

function Asteroid(x, y) {
    this.shape = [...Array(15).keys()].map(() => 2 * (Math.random() - 0.5));
    this.segments = 15;
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.skew = 0.2;
    this.fill = '#999999';
    this.stroke = '#999999';
}

Asteroid.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.strokeStyle = this.stroke;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    this.shape.forEach(function(x_adjust) {
        ctx.rotate(2 * Math.PI / this.segments);
        ctx.lineTo(this.radius + this.radius * this.skew * x_adjust, 0);
    }, this);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function Asteroids(ctx) {
    this.threshhold = 25;
    this.movement = 1;
    this.score = 0;
    this.asteroids = [new Asteroid(ctx.canvas.width * Math.random(), 0)];
}


Asteroids.prototype.draw = function (ctx) {
    this.asteroids.forEach(asteroid => asteroid.draw(ctx));
}

Asteroids.prototype.highestAsteroid = function (max) {
    return this.asteroids[this.asteroids.length - 1].y;
}

Asteroids.prototype.move = function (ctx) {
    // Move each asteroid down the field
    this.asteroids.map(asteroid => asteroid.y += this.movement);

    // Remove asteroids that have scrolled off the bottom.
    let current = this.asteroids.length
    this.asteroids = this.asteroids.filter(asteroid => (asteroid.y - asteroid.radius) < ctx.canvas.height);
    this.score += ((current - this.asteroids.length) * this.movement);

    // Add a new asteroid when the highest asteroid is beyond a specified threshhold.
    if (this.highestAsteroid(ctx.canvas.height, this.asteroids) > this.threshhold) {
        this.asteroids.push(new Asteroid(ctx.canvas.width * Math.random(), 0));
    }
}

Asteroids.prototype.distance = function(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

Asteroids.prototype.detectCollisions = function (object) {
    let collision = false;
    let idx = 0;

    while ((object.y - this.asteroids[idx].y) < (this.asteroids[idx].radius + object.radius)) {
        if (this.distance(this.asteroids[idx], object) < (this.asteroids[idx].radius + object.radius)) {
            collision = true;
        }
        idx += 1;
    }

    return collision;
}

function StroidAvoider() {
    this.ctx = window.document.getElementById('stroid-avoider').getContext('2d');;
    let divcanvas = document.getElementById('canvas-container')
    this.ctx.canvas.width = divcanvas.clientWidth;
    this.ctx.canvas.height = window.innerHeight - divcanvas.offsetTop - 10;

    this.asteroids = new Asteroids(this.ctx);
    this.spaceship = new Spaceship(this.ctx.canvas.width / 2, this.ctx.canvas.height - 18, 16);
    this.stars     = new Stars(this.ctx.canvas.width, this.ctx.canvas.height, 3000);

    this.doAnimation = false;
    this.cycles = 0;

    this.draw();
}

StroidAvoider.prototype.tick = function () {
    if (this.doAnimation) {
        this.draw();
        
        this.asteroids.move(this.ctx);
        this.spaceship.move(this.ctx, window.movement);
        window.movement = 'none';

        if (this.asteroids.detectCollisions(this.spaceship)) {
            this.endGame();
            this.sendScore();
        }
        
        this.cycles += 1;
        if (this.cycles === 2000) {
            this.asteroids.movement += 1;
            this.cycles = 0;
        }
    }
}

StroidAvoider.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawBackground();
    this.stars.draw(this.ctx);
    this.asteroids.draw(this.ctx);
    this.spaceship.draw(this.ctx);
}

StroidAvoider.prototype.drawBackground = function () {
    this.ctx.fillStyle = '#000000';
    this.ctx.save();
    this.ctx.rect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fill();
    this.ctx.restore();
}

StroidAvoider.prototype.score = function () {
    return this.asteroids.score;
}

StroidAvoider.prototype.togglePause = function () {
    $('#button-play')[0].textContent = this.doAnimation ? "Play" : "Pause";
    this.doAnimation = !this.doAnimation;
}

StroidAvoider.prototype.endGame = function () {
    this.doAnimation = false;
    $('#button-play').hide();
    $('#button-play')[0].disabled = true;
    $('#button-new').show();
    $('#button-new')[0].disabled = false;
}

StroidAvoider.prototype.newGame = function () {
    this.asteroids = new Asteroids(this.ctx);
    this.spaceship = new Spaceship(this.ctx.canvas.width / 2, this.ctx.canvas.height - 18, 16);
    this.stars     = new Stars(this.ctx.canvas.width, this.ctx.canvas.height, 3000);

    this.cycles = 0;
    this.doAnimation = false;
    $('#button-play')[0].textContent = "Play";
    $('#button-play').show();
    $('#button-play')[0].disabled = false;
    $('#button-new').hide();
    $('#button-new')[0].disabled = true;
    this.draw();
}

StroidAvoider.prototype.setNextShipMovement = function (move) {
    this.spaceship.move(this.ctx, move);
}

StroidAvoider.prototype.sendScore = function () {
    let score = $('#score-current .player-score').text();
    let name = $('#score-current .player-name').val();
    $.ajax({
        url: '/stroid-avoider/highscore/'+name+'/'+score,
        method: 'PUT',
        contentType: 'application/json',
        success: function(result) {
            window.stroidAvoider.getHighScores();
        },
        error: function(request,msg,error) {
        }
    });
}

StroidAvoider.prototype.getHighScores = function () {
    $.ajax({
        url: '/stroid-avoider/highscores',
        method: 'GET',
        contentType: 'application/json',
        success: function(result) {
            scores = JSON.parse(result);
            scores.forEach(function(score, index) {
                $('#score-high-'+(index+1)+' .player-name').text(score['user']);
                $('#score-high-'+(index+1)+' .player-score').text(score['score']);
            });
        },
        error: function(request,msg,error) {
            window.err = request.msg.error
        }
    });
}

function keyboardListen() {
    window.addEventListener("keydown", function (event) {
        if (event.defaultPrevented) {
            return;
        }

        switch (event.key) {
        case "ArrowLeft":
            window.stroidAvoider.setNextShipMovement('left');
            break;
        case "ArrowRight":
            window.stroidAvoider.setNextShipMovement('right');
            break;
        case "ArrowDown":
            window.stroidAvoider.setNextShipMovement('stop');
            break;
        case "p":
            window.stroidAvoider.togglePause()
        default:
            return;
        }

        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }, true);
}

function draw() {
    if (window.stroidAvoider == null) {
        window.stroidAvoider = new StroidAvoider();
        window.stroidAvoider.getHighScores();
        window.score = 0;
        keyboardListen();
    }
    window.stroidAvoider.tick();
    let score = window.stroidAvoider.score();
    if (score > window.score) {
        $('#score-current .player-score').text(score);
        window.score = score;
    }
    window.requestAnimationFrame(draw);
}

function init() {
    window.requestAnimationFrame(draw);
}

init();
