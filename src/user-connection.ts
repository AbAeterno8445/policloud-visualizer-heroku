export class UserConnection {
    public id: string;
    public originUser: string;
    public targetUser: string;

    constructor(id: string, origin: string, target: string) {
        this.id = id;
        this.originUser = origin;
        this.targetUser = target;
    }
}