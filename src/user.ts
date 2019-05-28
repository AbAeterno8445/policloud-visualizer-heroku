export class User {
    private _id: string;
    private _name: string;
    private _imagePath: string;
    private _color: string;

    constructor(id: string, name: string, imagePath: string, color: string) {
        this._id = id;
        this._name = name;
        this._imagePath = imagePath;
        this._color = color;

        //this._color = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
    }

    // GET id
    get id(): string { return this._id; }

    // GET/SET name
    get name(): string { return this._name; }
    set name(n: string) { this._name = n; }

    // GET/SET image path
    get imagePath(): string { return this._imagePath; }
    set imagePath(imgp: string) { this._imagePath = imgp; }

    // GET/SET color
    get color(): string { return this._color; }
    set color(c: string) { this._color = c; }
}