// Local Storage Wrapper Class
class LocalDB {
  constructor() {
    this.key = 'study-sessions-v2';
  }

  _get() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  }

  _set(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  get sessions() {
    return {
      add: async (data) => {
        const list = this._get();
        const newItem = { ...data, id: Date.now() + Math.random() };
        list.push(newItem);
        this._set(list);
        return newItem.id;
      },
      bulkAdd: async (items) => {
        const list = this._get();
        const newItems = items.map(i => ({...i, id: i.id || Date.now() + Math.random()}));
        this._set([...list, ...newItems]);
      },
      delete: async (id) => {
        const list = this._get();
        this._set(list.filter(item => item.id !== id));
      },
      toArray: async () => {
        return this._get();
      },
      orderBy: (field) => {
        return {
          reverse: () => ({
            toArray: async () => {
              const list = this._get();
              return list.sort((a, b) => {
                const valA = new Date(a[field]).getTime();
                const valB = new Date(b[field]).getTime();
                return valB - valA;
              });
            }
          })
        };
      },
      where: (field) => {
        return {
          aboveOrEqual: (value) => ({
            toArray: async () => {
              const list = this._get();
              const compareDate = new Date(value).getTime();
              return list.filter(item => {
                const itemDate = new Date(item[field]).getTime();
                return itemDate >= compareDate;
              });
            }
          })
        };
      }
    };
  }
}

export const db = new LocalDB();