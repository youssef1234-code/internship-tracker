import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "../ui/form.tsx";
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { Checkbox } from "../ui/checkbox.tsx";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select.tsx";

const InternshipReportForm = ({ internship, courses = [], onSubmit }) => {
  const [activeTab, setActiveTab] = useState("report");
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const form = useForm({
    defaultValues: {
      title: "",
      introduction: "",
      body: "",
      recommendation: false,
      companyRating: 3,
      evaluationNotes: "",
    }
  });

  const handleCourseToggle = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = (data) => {
    const reportData = {
      ...data,
      selectedCourses,
      internshipId: internship.id,
    };
    
    onSubmit(reportData);
    toast({
      title: "Report Submitted",
      description: "Your internship report has been submitted successfully!",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Internship Report - {internship?.position} at {internship?.company}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="report" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="report">Report Details</TabsTrigger>
            <TabsTrigger value="evaluation">Company Evaluation</TabsTrigger>
            <TabsTrigger value="courses">Relevant Courses</TabsTrigger>
            <TabsTrigger value="preview">Final Preview</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <TabsContent value="report" className="space-y-6">
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a title for your report" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  name="introduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Introduction</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide an introduction to your internship experience..." 
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Body</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detail your responsibilities, learning experiences, challenges and accomplishments..." 
                          className="min-h-64"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline">Save Draft</Button>
                  <Button type="button" onClick={() => setActiveTab("evaluation")}>Next: Evaluation</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="evaluation" className="space-y-6">
                <FormField
                  name="recommendation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I recommend this company to other students
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  name="companyRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Rating (1-5)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  name="evaluationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluation Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed feedback about your experience with this company..." 
                          className="min-h-40"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your evaluation will help other students make informed decisions.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("report")}>Previous: Report</Button>
                  <Button type="button" onClick={() => setActiveTab("courses")}>Next: Courses</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="courses" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Select courses that helped you during your internship</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(course => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`course-${course.id}`}
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => handleCourseToggle(course.id)}
                        />
                        <label 
                          htmlFor={`course-${course.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {course.code}: {course.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("evaluation")}>Previous: Evaluation</Button>
                  <Button type="button" onClick={() => setActiveTab("preview")}>Next: Preview</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Report Preview</h3>
                    <div className="mt-4 p-6 border rounded-md bg-gray-50">
                      <h2 className="text-xl font-bold">{form.watch("title") || "[No Title]"}</h2>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold">Introduction</h4>
                        <p className="mt-2 whitespace-pre-line">{form.watch("introduction") || "[No Introduction]"}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold">Body</h4>
                        <p className="mt-2 whitespace-pre-line">{form.watch("body") || "[No Body Content]"}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold">Company Evaluation</h4>
                        <p className="mt-2">Rating: {form.watch("companyRating")}/5</p>
                        <p className="mt-1">Recommendation: {form.watch("recommendation") ? "Yes" : "No"}</p>
                        <p className="mt-2 whitespace-pre-line">{form.watch("evaluationNotes") || "[No Evaluation Notes]"}</p>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-semibold">Relevant Courses</h4>
                        {selectedCourses.length > 0 ? (
                          <ul className="mt-2 list-disc list-inside">
                            {selectedCourses.map(courseId => {
                              const course = courses.find(c => c.id === courseId);
                              return course ? (
                                <li key={courseId}>{course.code}: {course.name}</li>
                              ) : null;
                            })}
                          </ul>
                        ) : (
                          <p className="mt-2">[No Courses Selected]</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("courses")}>Previous</Button>
                  <Button type="submit">Submit Final Report</Button>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InternshipReportForm;
