export default abstract class BaseFilterModel{
    public limit?: number; 
    public page?: number; 
    public sortOrder?: "asc" | "desc";
}