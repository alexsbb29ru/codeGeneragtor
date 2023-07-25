/* eslint-disable no-prototype-builtins */
export class ObjectMapper {
    constructor() {
        return
    }
    /**
     * Маппер свойств и их значений из исходного объекта в целевой
     * @param sourceObject Исходный объект
     * @param targetObject Целевой объект
     */
    map<T extends object>(sourceObject: T, targetObject: T) {
        //Получаем исходные свойства, данные которых нужно скопировать в целевой объект
        const targetProps = Object.getOwnPropertyNames(targetObject)

        if (targetProps.length > 0) {
            targetProps.forEach((item) => {
                //Проверяем, чтобы в исходном объекте тоже присутствовали свойства
                if (this.hasOwnProperty(sourceObject, item)) {
                    //Проверяем, есть ли дочение свойства у объекта
                    //Если есть, то рекурсией проходим по ним
                    //Попутно проверяем, чтобы дочернее свойство было объектом
                    const ObjectItem = item as keyof T
                    if (
                        Object.getOwnPropertyNames(targetObject[ObjectItem])
                            .length > 0 &&
                        typeof targetObject[ObjectItem] === "object"
                    )
                        this.map(
                            sourceObject[ObjectItem] as object,
                            targetObject[ObjectItem] as object
                        )
                    //Переносим свойства в целевой объект
                    else targetObject[ObjectItem] = sourceObject[ObjectItem]
                }
            })
        }
    }

    private hasOwnProperty<O extends object, P extends PropertyKey>(
        object: O,
        property: P
    ): boolean {
        return object.hasOwnProperty(property)
    }
}
