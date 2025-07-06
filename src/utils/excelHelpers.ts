// No import statement for office-js here.
// We expect 'Excel' to be a global object provided by the Office environment and its types.

export async function getWorksheetNames(): Promise<string[]> {
  try {
    return await Excel.run(async (context: Excel.RequestContext) => {
      const sheets = context.workbook.worksheets;
      sheets.load('items/name');
      await context.sync();
      return sheets.items.map((sheet: Excel.Worksheet) => sheet.name);
    });
  } catch (error) {
    console.error('Error getting worksheet names:', error);
    // Return default worksheets if Excel API fails
    return ['Sheet1', 'Sheet2', 'Sheet3'];
  }
}

export async function getSelectedRange(): Promise<string> {
  try {
    return await Excel.run(async (context: Excel.RequestContext) => {
      const range = context.workbook.getSelectedRange();
      range.load('address');
      await context.sync();
      return range.address;
    });
  } catch (error) {
    console.error('Error getting selected range:', error);
    return '';
  }
}

export async function insertDataToRange(worksheetName: string, rangeAddress: string, data: any[][]): Promise<void> {
  try {
    await Excel.run(async (context: Excel.RequestContext) => {
      const worksheet = context.workbook.worksheets.getItem(worksheetName);
      const range = worksheet.getRange(rangeAddress);
      
      // Calculate the range size needed
      const rows = data.length;
      const cols = data[0]?.length || 0;
      
      if (rows > 0 && cols > 0) {
        const targetRange = range.getResizedRange(rows - 1, cols - 1);
        targetRange.values = data;
        
        // Format headers if they exist
        if (rows > 1) {
          const headerRange = range.getResizedRange(0, cols - 1);
          headerRange.format.fill.color = '#4472C4';
          headerRange.format.font.color = 'white';
          headerRange.format.font.bold = true;
        }
      }
      
      await context.sync();
    });
  } catch (error) {
    console.error('Error inserting data to range:', error);
    throw error;
  }
} 