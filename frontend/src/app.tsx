import { Button, Input, InputNumber, Spin } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from "recharts";
import { Form } from "./app.styled";

interface IForm {
  stock: string;
  date: string;
}

interface INeg {
  price: number;
  time: string;
  quantity: number;
}

const computeAvg = (negs: INeg[]) => {
  let s = 0, q = negs.reduce((pv, cv) =>  pv + cv.quantity, 0)
  negs.forEach(neg => s += neg.price*neg.quantity);
  console.log(21, negs.length);
  return {
    price: s / q,
    quantity: q/negs.length,
    time: negs[0].time
  };
}

const formatter = (value: any, name: any) => {
  return value.toFixed(2);
}

const App = () => {
  const [negs, setNegs] = useState<INeg[]>([]);
  const [size, setSize] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(false);

  const { control, handleSubmit } = useForm<IForm>({
    defaultValues: {
      stock: "PETR3",
      date: "2023-10-04"
    }
  });

  const onSubmit = async (params: IForm) => {
    console.log(28, params);
    setLoading(true);
    const response = await axios.get(`http://localhost:3001`, { params });
    console.log(30, response.data);
    setNegs(response.data);
    setLoading(false);
  }

  const data = useMemo(() => {
    let current: INeg[] = [],
          result: INeg[] = [];

    negs.forEach((neg, index) => {
      current.push(neg);
      if (current.length === size) {
        result.push(computeAvg(current));
        current = [];
      }
    });

    if (current.length > 0) {
      result.push(computeAvg(current));
    }

    return result;
  }, [negs, size]);
  console.log(35, data);

  return (
    <div className="h-100 d-flex justify-content-center align-items-center">
      <div>
        <Form onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="Stock">
            <Controller
              name="stock"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item label="Date">
            <Controller
              name="date"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Button htmlType="submit" className="w-100">
            Fetch
          </Button>
        </Form>
        <Spin tip="Loading..." spinning={loading}>
        <ComposedChart
          width={500}
          height={400}
          data={data}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="time" /* type="number" */tickFormatter={v => dayjs(v).format("HH[h]")} />
          <YAxis dataKey="quantity" yAxisId="left" type="number" name="quantity" />
          <YAxis dataKey="price"  yAxisId="right" type="number" orientation="right" name="price" />
          <Tooltip formatter={v => (v as number).toFixed(2)} labelFormatter={v => dayjs(v).format("HH[h]mm")}/>
          <Legend />
          <Bar dataKey="quantity" barSize={20} fill="#413ea0" yAxisId="left" name="quantity" />
          <Line dataKey="price" stroke="#ff7300" yAxisId="right" dot={false} name="price" />
        </ComposedChart>
        </Spin>

        <Form.Item label="sample size">
          <InputNumber min={1} value={size} onChange={v => setSize(v ?? 1)} />
        </Form.Item>

      </div>
    </div>
  );
}

export default App;
