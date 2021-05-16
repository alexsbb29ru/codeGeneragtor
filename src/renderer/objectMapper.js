"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectMapper = void 0;
class ObjectMapper {
    constructor() { }
    /**
     * Маппер свойств и их значений из исходного объекта в целевой
     * @param sourceObject Исходный объект
     * @param targetObject Целевой объект
     */
    map(sourceObject, targetObject) {
        //Получаем исходные свойства, данные которых нужно скопировать в целевой объект
        let targetProps = Object.getOwnPropertyNames(targetObject);
        if (targetProps.length > 0) {
            targetProps.forEach((item) => {
                //Проверяем, чтобы в исходном объекте тоже присутствовали свойства
                if (this.hasOwnProperty(sourceObject, item)) {
                    //Проверяем, есть ли дочение свойства у объекта
                    //Если есть, то рекурсией проходим по ним
                    //Попутно проверяем, чтобы дочернее свойство было объектом
                    let ObjectItem = item;
                    if (Object.getOwnPropertyNames(targetObject[ObjectItem])
                        .length > 0 &&
                        typeof targetObject[ObjectItem] === "object")
                        this.map(sourceObject[ObjectItem], targetObject[ObjectItem]);
                    //Переносим свойства в целевой объект
                    else
                        targetObject[ObjectItem] = sourceObject[ObjectItem];
                }
            });
        }
    }
    hasOwnProperty(object, property) {
        return object.hasOwnProperty(property);
    }
}
exports.ObjectMapper = ObjectMapper;
