import Papa from 'papaparse'

export const load = async ({ fetch }) => {
    const responseCustomers = await fetch('https://raw.githubusercontent.com/JannesPeeters/suncharge/main/data/Customers.csv', {
    headers: {
        'Content-Type': 'text/csv'
    }})
    let csvCustomers = await responseCustomers.text()
    let parsedCsvCustomers = Papa.parse(csvCustomers, {skipEmptyLines: true, header: true})


    const responseSales = await fetch('https://raw.githubusercontent.com/JannesPeeters/suncharge/main/data/Sales.csv', {
        headers: {
            'Content-Type': 'text/csv'
        }})
        let csvSales= await responseSales.text()
        let parsedCsvSales = Papa.parse(csvSales, {skipEmptyLines: true, header: true})

    const responsePlants = await fetch('http://localhost:5173/data/Plants.csv', {
        headers: {
            'Content-Type': 'text/csv'
        }})
        let csvPlants= await responsePlants.text()
        let parsedCsvPlants = Papa.parse(csvPlants, {skipEmptyLines: true, header: true})

    // const responseCPR = await fetch('https://raw.githubusercontent.com/JannesPeeters/suncharge/main/data/CustomerPlantRelation.csv', {
    //     headers: {
    //         'Content-Type': 'text/csv'
    //     }})
    //     let csvCPR= await responseCPR.text()
    //     let parsedCsvCPR = Papa.parse(csvCPR, {skipEmptyLines: true, header: true})

    return {
      customers: parsedCsvCustomers,
      sales: parsedCsvSales,
      plants: parsedCsvPlants
    //   CPR: parsedCsvCPR
    }
  }