export class ServicesFireBase {
  private memoryData: Map<string, any>;

  constructor() {
    // Initialize memory storage
    this.memoryData = new Map<string, any>();
  }

  // Save data to memory
  public saveToMemory(key: string, data: any): void {
    this.memoryData.set(key, data);
  }

  // Get data from memory
  public getFromMemory(key: string): any {
    return this.memoryData.get(key);
  }

  // Delete data from memory
  public deleteFromMemory(key: string): boolean {
    return this.memoryData.delete(key);
  }

  // Clear all data from memory
  public clearMemory(): void {
    this.memoryData.clear();
  }
}
