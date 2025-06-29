class Vector {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static fromAngle(angle: number, length = 1) {
        return new Vector(Math.cos(angle) * length, Math.sin(angle) * length);
    }

    add(vec: Vector | number) {
        if (vec instanceof Vector) {
            this.x += vec.x;
            this.y += vec.y;
        } else {
            this.x += vec;
            this.y += vec;
        }
        return this;
    }

    sub(vec: Vector | number) {
        if (vec instanceof Vector) {
            this.x -= vec.x;
            this.y -= vec.y;
        } else {
            this.x -= vec;
            this.y -= vec;
        }
        return this;
    }

    mult(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    div(scalar: number) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        return this.length > 0 ? this.div(this.length) : this;
    }

    dot(vec: Vector) {
        return this.x * vec.x + this.y * vec.y;
    }

    proj(vec: Vector) {
        const k = this.dot(vec) / vec.dot(vec);
        return vec.copy().mult(k);
    }

    setXY(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    setVec(vec: Vector) {
        return this.setXY(vec.x, vec.y);
    }

    setLength(value: number) {
        return this.normalize().mult(value);
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    distance(vec: Vector) {
        return this.copy().sub(vec).length;
    }

    angle(vec: Vector) {
        const copy = vec.copy().sub(this);
        return Math.atan2(copy.y, copy.x);
    }

    direction(angle: number, length: number) {
        return this.copy().add(Vector.fromAngle(angle, length));
    }

    isEqual(vec: Vector) {
        return this.x === vec.x && this.y === vec.y;
    }

    stringify() {
        return this.x + ":" + this.y;
    }
}

export default Vector;