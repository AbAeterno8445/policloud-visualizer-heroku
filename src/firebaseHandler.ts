import {User} from './user';
import {UserConnection} from './user-connection';

const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', '/src/obliteration-d9fd3-firebase-adminsdk-oe49d-b32c52136f.json'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export class FirebaseHandler {
    private _userList: User[] = new Array();
    private _connectionList: UserConnection[] = new Array();
    private _userColl: string;
    private _connColl: string;
    private db: any;
    private _socketIO: any;

    constructor(socketIO: any, usersColl: string, connColl: string) {
        this._socketIO = socketIO;
        this._userColl = usersColl;
        this._connColl = connColl;
        this.db = admin.firestore();

        var self = this;
        // Añadir usuarios
        this.db.collection(this._userColl).onSnapshot(function(collSnap: any) {
            collSnap.docChanges().forEach(function(change: any) {
                var usrID = change.doc.id.trim();
                var usrName = change.doc.get('name').trim();
                var usrImg = change.doc.get('downloadURL').trim();
                var usrColor = change.doc.get('color');

                if (change.type === "added") {
                    console.log("NUEVO USUARIO: ");
                    console.log("ID: ", usrID);
                    console.log("NAME: ", usrName);
                    console.log("DOWNLOADURL: ", usrImg);

                    self.addUser(usrID, usrName, usrImg, usrColor);
                } else if (change.type === "modified") {
                    console.log("USUARIO MODIFICADO: ");
                    console.log("ID: ", usrID);
                    self.modifyUser(usrID, usrName, usrImg, usrColor);
                } else if (change.type === "removed") {
                    console.log("USUARIO BORRADO: ")
                    console.log("ID: ", usrID);
                    self.deleteUser(usrID);
                }
            });
        });
        
        // Añadir conexiones
        this.db.collection(this._connColl).onSnapshot(function(collSnap: any) {
            collSnap.docChanges().forEach(function(change: any) {
                var connID = change.doc.id.trim();
                var connUsr1 = change.doc.get('uidScanningUser').trim();
                var connUsr2 = change.doc.get('uidScannedUser').trim();
                if (change.type === "added") {
                    console.log("NUEVA CONEXION: ");
                    console.log("ID: ", connID);
                    console.log("1: ", connUsr1);
                    console.log("2: ", connUsr2);
                    self.connectUsers(connID, connUsr1, connUsr2);
                } else if (change.type === "modified") {
                    console.log("CONEXION MODIFICADA: ");
                    console.log("ID: ", connID);
                    console.log("1: ", connUsr1);
                    console.log("2: ", connUsr2);
                    self.modifyConnection(connID, connUsr1, connUsr2);
                } else if (change.type == "removed") {
                    console.log("CONEXION BORRADA: ");
                    console.log("ID: ", connID);
                    self.deleteConnection(connID, false);
                }
            });
        })
    }

    // GET user list
    get userList(): User[] { return this._userList; }

    // GET connections list
    get connectionList(): UserConnection[] { return this._connectionList; }

    /** Find an user in the local list */
    public findUser(id: string): User {
        return this._userList.find((usr) => usr.id === id);
    }

    /** Adds an user to local list; fails if an user with the same name already exists */
    public addUser(id: string, username: string, imgpath: string, color: string): boolean {
        if (this.findUser(id) != undefined) return false;

        var newUser = new User(id, username, imgpath, color);
        this._userList.push(newUser);
        this._socketIO.sockets.emit("newUser", {
            uid: id,
            name: username,
            downloadURL: imgpath,
            color: color
        });
        return true;
    }

    /** Modifies values on an existing user */
    public modifyUser(id: string, username: string, imgpath: string, color: string) {
        var modUser = this.findUser(id);
        if (modUser) {
            modUser.name = username;
            modUser.imagePath = imgpath;
            modUser.color = color;
            this._socketIO.sockets.emit("modUser", {
                uid: id,
                name: username,
                downloadURL: imgpath,
                color: color
            });
        }
    }

    /** Deletes an user */
    public deleteUser(id: string) {
        var delUser = this.findUser(id);
        if (delUser) {
            this._userList.splice(this._userList.indexOf(delUser));
            this._socketIO.sockets.emit("delUser", {uid: id});

            var self = this;
            this._connectionList.forEach(function(conn) {
                if (conn.originUser === id || conn.targetUser === id) {
                    self.deleteConnection(conn.id, true);
                }
            })
        }
    }

    /** Returns a connection based on id */
    public findConnection(id: string) {
        return this._connectionList.find((conn) => conn.id === id);
    }

    /** Connects two users */
    public connectUsers(id: string, origin: string, target: string) {
        if (this.findConnection(id) != undefined) return;

        var newConn = new UserConnection(id, origin, target);
        this._connectionList.push(newConn);
        this._socketIO.sockets.emit("connUsers", {cid: id, usr1: origin, usr2: target});
    }

    /** Modify an existing connection */
    public modifyConnection(id: string, origin: string, target: string) {
        var conn = this.findConnection(id);
        if (conn) {
            conn.originUser = origin;
            conn.targetUser = target;
            this._socketIO.sockets.emit("modConn", {cid: id, usr1: origin, usr2: target});
        }
    }

    /** Deletes an existing connection */
    public deleteConnection(id: string, updateDB: boolean) {
        var conn = this.findConnection(id);
        if (conn) {
            this._connectionList.splice(this._connectionList.indexOf(conn));
            this._socketIO.sockets.emit("delConn", {cid: id});

            if (updateDB) {
                var connDoc = this.db.collection(this._connColl).doc(id);
                if (connDoc) {
                    connDoc.delete();
                }
            }
        }
    }
}