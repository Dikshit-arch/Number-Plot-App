
import React, { useState, useEffect } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NumberPlotApp = () => {
  const [inputValue, setInputValue] = useState("");
  const [description, setDescription] = useState("");
  const [data, setData] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const savedData = localStorage.getItem("graphData");
    if (savedData) {
      setData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("graphData", JSON.stringify(data));
  }, [data]);

  const handleAddPoint = () => {
    const number = parseFloat(inputValue);

    if (isNaN(number) || number < -100 || number > 100) {
      alert("Please enter a number between -100 and +100.");
      return;
    }

    const newPoint = {
      date: new Date(selectedDate).toLocaleDateString(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      day: new Date(selectedDate).toLocaleString("en-us", { weekday: "long" }),
      value: number,
      description: description,
    };

    setData((prevData) => [...prevData, newPoint]);
    setRedoStack([]);
    setInputValue("");
    setDescription("");
  };

  const handleEditDescription = (index, newDescription) => {
    setData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index] = { ...updatedData[index], description: newDescription };
      return updatedData;
    });
  };

  const handleUndo = () => {
    if (data.length === 0) return;
    setRedoStack((prevRedo) => [data[data.length - 1], ...prevRedo]);
    setData((prevData) => prevData.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const lastRedo = redoStack[0];
    setRedoStack((prevRedo) => prevRedo.slice(1));
    setData((prevData) => [...prevData, lastRedo]);
  };

  const categorizedData = data.map((point) => {
    const date = new Date(point.date);
    const day = date.getDate();
    return {
      ...point,
      name: `${day}`,
    };
  });

  const groupedByMonthYear = data.reduce((acc, point) => {
    const dateObj = new Date(point.date);
    const key = `${dateObj.toLocaleString("default", { month: "long" })} ${dateObj.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(point);
    return acc;
  }, {});

  console.log("Grouped Data by Month and Year:", groupedByMonthYear);

  return (
    <div className="min-h-screen bg-black text-gray-300 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-4xl p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-extrabold mb-6 text-center text-gray-100">Cracker System Graph</h1>
          <div className="flex flex-col items-center gap-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 text-gray-300 border border-gray-600 rounded-md"
            />
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a number (-100 to +100)"
              className="bg-gray-800 text-gray-300 border border-gray-600 rounded-md"
            />
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              className="bg-gray-800 text-gray-300 border border-gray-600 rounded-md"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddPoint} className="bg-gray-700 text-gray-100 hover:bg-gray-600 rounded-md px-4 py-2 shadow-md">
                Add Point
              </Button>
              <Button onClick={handleUndo} className="bg-gray-700 text-gray-100 hover:bg-gray-600 rounded-md px-4 py-2 shadow-md">
                Undo Last
              </Button>
              <Button onClick={handleRedo} className="bg-gray-700 text-gray-100 hover:bg-gray-600 rounded-md px-4 py-2 shadow-md">
                Redo Last
              </Button>
            </div>
          </div>
          <div className="mt-8">
            <LineChart
              width={800}
              height={400}
              data={categorizedData}
              margin={{ top: 20, right: 10, left: 10, bottom: 50 }}
            >
              <CartesianGrid stroke="#444" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                stroke="#ccc"
                interval={0}
                tickFormatter={(value) => value}
                textAnchor="middle"
              />
              <YAxis
                stroke="#ccc"
                domain={[-100, 100]}
                ticks={Array.from({ length: 21 }, (_, i) => 100 - i * 10)}
                allowDataOverflow={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const { name, value, date, time, day, description } = payload[0].payload;
                    return (
                      <div className="p-4 bg-black text-gray-100 rounded-lg shadow-lg">
                        <p className="font-semibold text-lg">{`${day}, ${date} ${time}`}</p>
                        <p className="text-sm">Value: <span className="font-bold">{value}</span></p>
                        <div className="mt-2">
                          <p className="text-sm mb-1">Description:</p>
                          <p className="font-light">{description || "No description"}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                wrapperStyle={{ backgroundColor: "#000", color: "#fff" }}
              />
              {categorizedData.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = categorizedData[index - 1];
                const valueDiff = Math.abs(point.value - prevPoint.value);
                const isIncrease = point.value >= prevPoint.value;
                const baseColor = isIncrease ? [0, 255, 0] : [255, 0, 0];
                const proximityFactor = Math.min(valueDiff / 10, 1);
                const blendedColor = baseColor.map((c) => Math.floor(c * proximityFactor + 100 * (1 - proximityFactor)));
                const strokeColor = `rgb(${blendedColor.join(",")})`;

                return (
                  <Line
                    key={`line-segment-${index}`}
                    type="monotone"
                    dataKey="value"
                    stroke={strokeColor}
                    strokeWidth={3}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </div>
          <div className="mt-8">
            {data.map((point, index) => (
              <div key={index} className="text-gray-100 mb-2">
                <p>{`${point.day}, ${point.date} - ${point.description || "No description"}`}</p>
                <Input
                  type="text"
                  value={point.description}
                  onChange={(e) => handleEditDescription(index, e.target.value)}
                  placeholder="Edit description"
                  className="bg-gray-800 text-gray-300 border border-gray-600 rounded-md mt-2 p-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NumberPlotApp;
