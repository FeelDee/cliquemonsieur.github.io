/* rxjs mind your own business */

class Observable {
    listeners = [];

    constructor(value) {
        this._value = value;
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    unsubscribe(listener) {
        const index = this.listeners.indexOf(listener);
        if (index < 0) return;
        this.listeners.splice(index, 1);
    }

    next(value) {
        this._value = value;
        for (const listener of this.listeners) {
            listener(value);
        }
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this.next(value);
    }
}
