import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import logger from "../modules/logger";

class IndexAttr {
	name_array: string
	id_array: number
	table_name: string
	init_query: string
	constructor(name_array: string, id_array: number, table_name: string) {
		this.id_array = id_array
		this.name_array = '"' + name_array + '"'
		
		this.table_name = '"' + table_name + '"'
		this.init_query = ' update ' + this.table_name + ' set index = '
	}

	_getContext(idObject)
	{
		var context : string;
		if (this.id_array == null)
		{
			context = ' ' + this.name_array + ` = (select ${this.name_array } from ${this.table_name} where id = ${idObject})`;
		}
		else
		{
			context = ' ' + this.name_array + ' = ' + this.id_array
		}
		return context;

	}

	async getIndex(id_element: number) {
		var get =
			'select index from ' + this.table_name + ' where id = ' + id_element
		logger.debug(get)
		var res = await prisma.$queryRawUnsafe<any[]>(get)
		logger.debug('index of id_element is ', res)
		if (!res.length) return null
		return res[0]?.index
	}

	/**
	 *
	 * @param id_element id of source element
	 * @param src
	 * @param dest
	 * @returns
	 */
	async queryUpdateIndex(id_element: number, dest: number) {
		const src = await this.getIndex(id_element)

		if (src == null || src == dest) return
		var update: string, set: string
		if (src > dest) {
			update = this.produceSettingSql(
				'(select index + 1)',
				`
            index < ${src}
            and
                index >= ${dest}`
			, id_element)
			set = this.produceSettingSql(`${dest}`, `id = ${id_element}`, id_element)
		} else {
			update = this.produceSettingSql(
				'(select index - 1)',
				`
            index > ${src}
            and
                index <= ${dest}`, id_element
			)
			set = this.produceSettingSql(`${dest}`, `id = ${id_element}`, id_element)
		}

		logger.debug(update)
		var res = await prisma.$queryRawUnsafe<any[]>(update)
		logger.debug(res)
		res = await prisma.$queryRawUnsafe<any[]>(set)
		logger.debug(res)
		return res
	}

	/**
	 * return a sql query for setting index
	 */
	produceSettingSql(newValue: string, where: string, idObject: number) {
		return (
			this.init_query +
			newValue +
			' where ' +
			where +
			' and ' +
			this._getContext(idObject)
		)
	}

	async uncrementOver(id: number)   {
		logger.debug(this.produceSettingSql("index - 1", `index > (select index from ${this.table_name} where id = ${id})`, id));

		return await prisma.$queryRawUnsafe<any[]>(this.produceSettingSql("index - 1", `index > (select index from ${this.table_name} where id = ${id})`, id));
	}

	

	async reinit() {
		//on remet tous les projet dans l'ordre de leurs id selon leurs object contenant
		//pour chaque element on set index au nombre d'element qui on un id superieur dans son array
		const get =
			'select id , ' + this.name_array + ' from ' + this.table_name

		var items = await prisma.$queryRawUnsafe<any[]>(get)
		logger.debug(items)

		var querys = items.map((item) => {
			const set =
				'update ' +
				this.table_name +
				` set index = (select count(*) from ${
					this.table_name
				} where id < ${item.id} and ${this.name_array} = ${
					item[this.name_array.split('"')[1]]
				}) where id = ${item.id}`
			return prisma.$queryRawUnsafe<any[]>(set)
		})
		await Promise.all(querys)
		return
	}
}

module.exports = IndexAttr
