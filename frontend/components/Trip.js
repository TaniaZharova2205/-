import Load from './Load';
import AppModel from '../model/AppModel';

export default class Trip {
    #loads = [];
    #tripID = null;
    #tripFerry = '';
    #tripDest = '';
    #tripPosition = -1;
    #tripLimits = [];

    constructor({
                    tripID = null,
                    ferry,
                    dest,
                    position,
                    onDropLoadInTrip,
                    addNotification
                }) {

        this.#tripFerry = String(ferry);
        this.#tripDest = String(dest);
        this.#tripID = tripID || crypto.randomUUID();
        this.#tripPosition = position;
        console.log('trip_position', this.#tripPosition);
        this.onDropLoadInTrip = onDropLoadInTrip;
        this.addNotification = addNotification
    }

    get tripID() {
        return this.#tripID;
    }

    get tripDest() {
        return this.#tripDest;
    }

    get loads() {
        return this.#loads;
    }

    updateLimits = async () => {
        this.#tripLimits = await AppModel.getLimits({
            tripID: this.#tripID
        });
    }

    pushLoad = ({load}) => this.#loads.push(load);

    getLoadById = ({loadID}) => this.#loads.find(load => load.loadID === loadID);

    deleteLoad = ({loadID}) => {
        const deleteLoadIndex = this.#loads.findIndex(load => load.loadID === loadID);

        if (deleteLoadIndex === -1) return;

        const [deletedLoad] = this.#loads.splice(deleteLoadIndex, 1);

        return deletedLoad;
    };

    getCurrentLoads = () => {
        let car_place = 0;
        let load_place = 0;

        for (let load of this.#loads) {
            console.log(load);
            if (load.loadType === 'груз') {
                load_place += 1;
            }
            if (load.loadType === 'авто') {
                if (load.loadCarType === 'легковой') {
                    car_place += 1;
                }
                if (load.loadCarType === 'грузовой') {
                    car_place += 2;
                }
                if (load.loadCarType === 'тягач') {
                    car_place += 3;
                }
            }
        }

        console.log('car_place ', car_place, ' load_place ', load_place)
        return [car_place, load_place];
    };

    reorderLoads = async () => {
        const orderedLoadsIDs = Array.from(
            document.querySelector(`[id="${this.#tripID}"] .trip__loads-list`).children,
            elem => elem.getAttribute('id')
        );


        const reorderedLoadsInfo = [];

        orderedLoadsIDs.forEach((loadID, position) => {
            const load = this.#loads.find(load => load.loadID === loadID);
            if (load.loadPosition !== position) {
                load.loadPosition = position;
                reorderedLoadsInfo.push({
                    loadID,
                    position
                });
            }
        });

        if (reorderedLoadsInfo.length > 0) {
            try {
                await AppModel.updateLoads({
                    reorderedLoads: reorderedLoadsInfo
                });
            } catch (err) {
                this.addNotification({text: err.message, type: 'error'});
                console.error(err);
            }

        }

    };

    appendNewLoad = async ({name, type, car_type}) => {

        let tripLimits;
        try {
            //получение количества мест на пароме из бд:
            console.log(this.#tripID)
            tripLimits = await AppModel.getLimits({
                tripID: this.#tripID
            });
            tripLimits = tripLimits[0];
            console.log(tripLimits)
        } catch (err) {
            this.addNotification({text: err.message, type: 'error'});
            console.error(err);
        }

        const CurrentLoads = this.getCurrentLoads();
        console.log(CurrentLoads);
        let newLoad = CurrentLoads[1];
        let newCars = CurrentLoads[0];
        if (type === 'груз') {
            newLoad += 1;
        }
        if (type === 'авто') {
            if (car_type === 'легковой') {
                newCars += 1;
            }
            if (car_type === 'грузовой') {
                newCars += 2;
            }
            if (car_type === 'тягач') {
                newCars += 3;
            }
        }
        console.log(newCars, newLoad);
        if (tripLimits['car_place'] < newCars || tripLimits['load_place'] < newLoad) {
            this.addNotification({text: 'Не достаточно места на пароме', type: 'error'});
        } else {
            try {
                const loadID = crypto.randomUUID();
                const addLoadResult = await AppModel.addLoad({
                    loadID: loadID,
                    name: name,
                    type: type,
                    car_type: car_type,
                    position: this.#loads.length,
                    tripID: this.#tripID
                });

                this.addNewLoadLocal({
                    loadID: loadID,
                    name: name,
                    type: type,
                    car_type: car_type,
                    position: this.#loads.length
                });

                this.updateLimits();

                this.addNotification({text: addLoadResult.message, type: 'success'});
            } catch (err) {
                this.addNotification({text: err.message, type: 'error'});
                console.error(err);
            }
        }
    };

    addNewLoadLocal = ({loadID = null, name, type, car_type, position}) => {
        const newLoad = new Load({
            loadID,
            name,
            type,
            car_type,
            position,

        });
        this.#loads.push(newLoad);

        const newLoadElement = newLoad.render();
        document.querySelector(`[id="${this.#tripID}"] .trip__loads-list`)
            .appendChild(newLoadElement);
    };

    // rendering
    render() {
        const liElement = document.createElement('li');
        liElement.classList.add(
            'trips-list__item',
            'trip'
        );
        liElement.setAttribute('id', this.#tripID);
        liElement.addEventListener(
            'dragstart',
            () => localStorage.setItem('srcTripID', this.#tripID)
        );
        liElement.addEventListener('drop', this.onDropLoadInTrip);

        const tripHeader = document.createElement('li');
        tripHeader.classList.add('trip__header');

        const h2Element_name = document.createElement('h2');
        h2Element_name.classList.add('trip__name');
        h2Element_name.innerHTML = "Рейс";
        tripHeader.appendChild(h2Element_name);

        // кнопки
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('load__controls');

        const lowerRowDiv = document.createElement('div');
        lowerRowDiv.classList.add('load__controls-row');

        const editBtn = document.createElement('button');
        editBtn.setAttribute('type', 'button');
        editBtn.classList.add('trip__contol-btn', 'edit-icon');
        editBtn.addEventListener('click', () => {
            localStorage.setItem('editTripID', this.#tripID);
            document.getElementById('modal-edit-trip').showModal();
        });
        lowerRowDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.classList.add('trip__contol-btn', 'delete-icon');
        deleteBtn.addEventListener('click', () => {
            localStorage.setItem('deleteTripID', this.#tripID);
            const deleteTripModal = document.getElementById('modal-delete-trip');
            deleteTripModal.querySelector('.app-modal__question').innerHTML = `Рейс '${this.#tripID}' и все грузы, лежащие в этом рейсе, будут удалены. Продолжить?`;
            deleteTripModal.showModal();
        });

        lowerRowDiv.appendChild(deleteBtn);

        controlsDiv.appendChild(lowerRowDiv);

        tripHeader.appendChild(controlsDiv);
        liElement.appendChild(tripHeader);

        const h2Element_id = document.createElement('h2');
        h2Element_id.classList.add('trip__info');
        h2Element_id.innerHTML = "id: " + this.#tripID;
        liElement.appendChild(h2Element_id);

        const h2Element_dest = document.createElement('h2');
        h2Element_dest.classList.add('trip__info');
        h2Element_dest.innerHTML = "пункт: " + this.#tripDest;
        liElement.appendChild(h2Element_dest);

        const h2Element_ferry = document.createElement('h2');
        h2Element_ferry.classList.add('trip__info');
        h2Element_ferry.innerHTML = "паром: " + this.#tripFerry;
        liElement.appendChild(h2Element_ferry);


        const innerUlElement = document.createElement('ul');
        innerUlElement.classList.add('trip__loads-list');
        liElement.appendChild(innerUlElement);

        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.classList.add('trip__add-load-btn');
        button.innerHTML = '&#10010; Добавить груз';
        button.addEventListener('click', () => {
            localStorage.setItem('addLoadTripID', this.#tripID);
            document.getElementById('modal-add-load').showModal();
        });
        liElement.appendChild(button);

        const h2Element_car = document.createElement('h2');
        h2Element_car.classList.add('trip__info');
        console.log("limits: ", this.#tripLimits)
        h2Element_car.innerHTML = "машиномест: " + this.#tripLimits[0]["car_place"];
        liElement.appendChild(h2Element_car);

        const h2Element_loading = document.createElement('h2');
        h2Element_loading.classList.add('trip__info');
        console.log("limits: ", this.#tripLimits)
        h2Element_loading.innerHTML = "мест для груза: " + this.#tripLimits[0]["load_place"];
        liElement.appendChild(h2Element_loading);


        const tripsList = document.querySelector('.trips-list');
        tripsList.insertBefore(liElement, tripsList.firstChild);
    }
};
